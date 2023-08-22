// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient } from 'pg';
import {
  UpsertResult,
  UpsertRequest,
  DocumentReference,
  getMeadowlarkIdForDocumentReference,
  getMeadowlarkIdForSuperclassInfo,
  ReferringDocumentInfo,
  generateDocumentUuid,
  DocumentUuid,
  MeadowlarkId,
} from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import {
  deleteOutboundReferencesOfDocumentByMeadowlarkId,
  insertDocument,
  updateDocument,
  insertOutboundReferences,
  deleteAliasesForDocumentByMeadowlarkId,
  insertAlias,
  findAliasMeadowlarkId,
  findReferringDocumentInfoForErrorReporting,
  findDocumentByMeadowlarkId,
  beginTransaction,
  rollbackTransaction,
  commitTransaction,
} from './SqlHelper';
import { validateReferences } from './ReferenceValidation';
import { MeadowlarkDocument, NoMeadowlarkDocument } from '../model/MeadowlarkDocument';

const moduleName = 'postgresql.repository.Upsert';

export async function upsertDocument(upsertRequest: UpsertRequest, client: PoolClient): Promise<UpsertResult> {
  const { meadowlarkId, resourceInfo, documentInfo, validateDocumentReferencesExist, traceId } = upsertRequest;
  Logger.info(`${moduleName}.upsertDocument`, traceId);

  const outboundRefs = documentInfo.documentReferences.map((dr: DocumentReference) =>
    getMeadowlarkIdForDocumentReference(dr),
  );
  try {
    await beginTransaction(client);

    // Attempt to get the document, to see whether this is an insert or update
    const documentFromDb: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, meadowlarkId);
    const isInsert: boolean = documentFromDb === NoMeadowlarkDocument;

    // Either get the existing document uuid or create a new one
    const documentUuid: DocumentUuid = isInsert ? generateDocumentUuid() : documentFromDb.document_uuid;

    // If an update, check the request for staleness. If request is stale, return conflict.
    if (!isInsert && documentFromDb.last_modified_at >= documentInfo.requestTimestamp) {
      return { response: 'UPSERT_FAILURE_WRITE_CONFLICT' };
    }

    // If inserting a subclass, check whether the superclass identity is already claimed by a different subclass
    if (isInsert && documentInfo.superclassInfo != null) {
      const superclassAliasMeadowlarkIdInUseResult: MeadowlarkId[] = await findAliasMeadowlarkId(
        client,
        getMeadowlarkIdForSuperclassInfo(documentInfo.superclassInfo) as MeadowlarkId,
      );
      const superclassAliasMeadowlarkIdInUse: boolean = superclassAliasMeadowlarkIdInUseResult.length !== 0;

      if (superclassAliasMeadowlarkIdInUse) {
        Logger.debug(
          `${moduleName}.upsertDocument: Upserting document meadowlarkId ${meadowlarkId} failed due to another subclass with the same identity`,
          traceId,
        );

        const superclassAliasId: MeadowlarkId = getMeadowlarkIdForSuperclassInfo(
          documentInfo.superclassInfo,
        ) as MeadowlarkId;

        const referringDocumentInfo: ReferringDocumentInfo[] = await findReferringDocumentInfoForErrorReporting(client, [
          superclassAliasId,
        ]);

        await rollbackTransaction(client);
        return {
          response: 'INSERT_FAILURE_CONFLICT',
          failureMessage: `Insert failed: the identity is in use by '${resourceInfo.resourceName}' which is also a(n) '${documentInfo.superclassInfo.resourceName}'`,
          referringDocumentInfo,
        };
      }
    }

    if (validateDocumentReferencesExist) {
      const failures = await validateReferences(
        documentInfo.documentReferences,
        documentInfo.descriptorReferences,
        outboundRefs,
        client,
        traceId,
      );
      // Abort on validation failure
      if (failures.length > 0) {
        Logger.debug(
          `${moduleName}.upsertDocument: Inserting document meadowlarkId ${meadowlarkId} failed due to invalid references`,
          traceId,
        );

        const referringDocumentInfo: ReferringDocumentInfo[] = await findReferringDocumentInfoForErrorReporting(client, [
          meadowlarkId,
        ]);

        await rollbackTransaction(client);
        return {
          response: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE',
          failureMessage: { error: { message: 'Reference validation failed', failures } },
          referringDocumentInfo,
        };
      }
    }

    // Perform the document upsert
    Logger.debug(`${moduleName}.upsertDocument: Upserting document meadowlarkId ${meadowlarkId}`, traceId);

    if (isInsert) {
      await insertDocument(client, { ...upsertRequest, documentUuid });
    } else {
      await updateDocument(client, { ...upsertRequest, documentUuid });
    }

    // Delete existing values from the aliases table
    await deleteAliasesForDocumentByMeadowlarkId(client, meadowlarkId);

    // Perform insert of alias ids
    await insertAlias(client, documentUuid, meadowlarkId, meadowlarkId);
    if (documentInfo.superclassInfo != null) {
      const superclassAliasId: MeadowlarkId = getMeadowlarkIdForSuperclassInfo(documentInfo.superclassInfo) as MeadowlarkId;
      await insertAlias(client, documentUuid, meadowlarkId, superclassAliasId);
    }

    // Delete existing references in references table
    Logger.debug(`${moduleName}.upsertDocument: Deleting references for document meadowlarkId ${meadowlarkId}`, traceId);
    await deleteOutboundReferencesOfDocumentByMeadowlarkId(client, meadowlarkId);

    // Adding descriptors to outboundRefs for reference checking
    const descriptorOutboundRefs = documentInfo.descriptorReferences.map((dr: DocumentReference) =>
      getMeadowlarkIdForDocumentReference(dr),
    );
    outboundRefs.push(...descriptorOutboundRefs);

    // Perform insert of references to the references table
    // eslint-disable-next-line no-restricted-syntax
    for (const ref of outboundRefs) {
      Logger.debug(
        `post${moduleName}.upsertDocument: Inserting reference meadowlarkId ${ref} for document meadowlarkId ${meadowlarkId}`,
        ref,
      );
      await insertOutboundReferences(client, meadowlarkId, ref as MeadowlarkId);
    }

    await commitTransaction(client);
    return isInsert
      ? { response: 'INSERT_SUCCESS', newDocumentUuid: documentUuid }
      : { response: 'UPDATE_SUCCESS', existingDocumentUuid: documentUuid };
  } catch (e) {
    Logger.error(`${moduleName}.upsertDocument`, traceId, e);
    await rollbackTransaction(client);
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }
}
