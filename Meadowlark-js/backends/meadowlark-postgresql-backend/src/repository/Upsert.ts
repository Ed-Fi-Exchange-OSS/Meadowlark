// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient, QueryResult } from 'pg';
import {
  UpsertResult,
  UpsertRequest,
  DocumentReference,
  getMeadowlarkIdForDocumentReference,
  getMeadowlarkIdForSuperclassInfo,
  BlockingDocument,
  generateDocumentUuid,
  DocumentUuid,
  MeadowlarkId,
} from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import {
  deleteOutboundReferencesOfDocumentSql,
  documentInsertOrUpdateSql,
  insertOutboundReferencesSql,
  deleteAliasesForDocumentSql,
  insertAliasSql,
  findAliasIdSql,
  findReferringDocumentInfoForErrorReportingSql,
  findDocumentByMeadowlarkIdSql,
} from './SqlHelper';
import { validateReferences } from './ReferenceValidation';

const moduleName = 'postgresql.repository.Upsert';

export async function upsertDocument(
  { meadowlarkId, resourceInfo, documentInfo, edfiDoc, validateDocumentReferencesExist, traceId, security }: UpsertRequest,
  client: PoolClient,
): Promise<UpsertResult> {
  Logger.info(`${moduleName}.upsertDocument`, traceId);

  const outboundRefs = documentInfo.documentReferences.map((dr: DocumentReference) =>
    getMeadowlarkIdForDocumentReference(dr),
  );
  try {
    await client.query('BEGIN');

    // Check whether this is an insert or update
    const documentExistsResult: QueryResult = await client.query(findDocumentByMeadowlarkIdSql(meadowlarkId));
    const isInsert: boolean = documentExistsResult.rowCount === 0;
    const documentUuid: DocumentUuid =
      documentExistsResult.rowCount > 0 ? documentExistsResult.rows[0].document_uuid : generateDocumentUuid();
    // If inserting a subclass, check whether the superclass identity is already claimed by a different subclass
    if (isInsert && documentInfo.superclassInfo != null) {
      const superclassAliasIdInUseResult = await client.query(
        findAliasIdSql(getMeadowlarkIdForSuperclassInfo(documentInfo.superclassInfo) as MeadowlarkId),
      );
      const superclassAliasIdInUse: boolean = superclassAliasIdInUseResult.rowCount !== 0;

      if (superclassAliasIdInUse) {
        Logger.debug(
          `${moduleName}.upsertDocument: Upserting document meadowlarkId ${meadowlarkId} failed due to another subclass with the same identity`,
          traceId,
        );

        const superclassAliasId: MeadowlarkId = getMeadowlarkIdForSuperclassInfo(
          documentInfo.superclassInfo,
        ) as MeadowlarkId;

        const referringDocuments = await client.query(findReferringDocumentInfoForErrorReportingSql([superclassAliasId]));

        const blockingDocuments: BlockingDocument[] = referringDocuments.rows.map((document) => ({
          resourceName: document.resource_name,
          documentUuid: document.document_uuid,
          meadowlarkId: document.document_id,
          projectName: document.project_name,
          resourceVersion: document.resource_version,
        }));

        await client.query('ROLLBACK');
        return {
          response: 'INSERT_FAILURE_CONFLICT',
          failureMessage: `Insert failed: the identity is in use by '${resourceInfo.resourceName}' which is also a(n) '${documentInfo.superclassInfo.resourceName}'`,
          blockingDocuments,
        };
      }
    }

    const documentUpsertSql: string = documentInsertOrUpdateSql(
      { id: meadowlarkId, documentUuid, resourceInfo, documentInfo, edfiDoc, validateDocumentReferencesExist, security },
      isInsert,
    );

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

        const referringDocuments = await client.query(findReferringDocumentInfoForErrorReportingSql([meadowlarkId]));

        const blockingDocuments: BlockingDocument[] = referringDocuments.rows.map((document) => ({
          resourceName: document.resource_name,
          documentUuid: document.document_uuid,
          meadowlarkId: document.document_id,
          projectName: document.project_name,
          resourceVersion: document.resource_version,
        }));

        await client.query('ROLLBACK');
        return {
          response: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE',
          failureMessage: { error: { message: 'Reference validation failed', failures } },
          blockingDocuments,
        };
      }
    }

    // Perform the document upsert
    Logger.debug(`${moduleName}.upsertDocument: Upserting document meadowlarkId ${meadowlarkId}`, traceId);
    await client.query(documentUpsertSql);
    // Delete existing values from the aliases table
    await client.query(deleteAliasesForDocumentSql(meadowlarkId));
    // Perform insert of alias ids
    await client.query(insertAliasSql(documentUuid, meadowlarkId, meadowlarkId));
    if (documentInfo.superclassInfo != null) {
      const superclassAliasId: MeadowlarkId = getMeadowlarkIdForSuperclassInfo(documentInfo.superclassInfo) as MeadowlarkId;
      await client.query(insertAliasSql(documentUuid, meadowlarkId, superclassAliasId));
    }

    // Delete existing references in references table
    Logger.debug(`${moduleName}.upsertDocument: Deleting references for document meadowlarkId ${meadowlarkId}`, traceId);
    await client.query(deleteOutboundReferencesOfDocumentSql(meadowlarkId));

    // Adding descriptors to outboundRefs for reference checking
    const descriptorOutboundRefs = documentInfo.descriptorReferences.map((dr: DocumentReference) =>
      getMeadowlarkIdForDocumentReference(dr),
    );
    outboundRefs.push(...descriptorOutboundRefs);

    // Perform insert of references to the references table
    // eslint-disable-next-line no-restricted-syntax
    for (const ref of outboundRefs) {
      Logger.debug(`post${moduleName}.upsertDocument: Inserting reference id ${ref} for document id ${meadowlarkId}`, ref);
      await client.query(insertOutboundReferencesSql(meadowlarkId, ref as MeadowlarkId));
    }

    await client.query('COMMIT');
    return isInsert
      ? { response: 'INSERT_SUCCESS', newDocumentUuid: documentUuid }
      : { response: 'UPDATE_SUCCESS', existingDocumentUuid: documentUuid };
  } catch (e) {
    Logger.error(`${moduleName}.upsertDocument`, traceId, e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }
}
