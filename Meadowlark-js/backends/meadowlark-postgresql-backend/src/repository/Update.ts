// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  MeadowlarkId,
  UpdateResult,
  UpdateRequest,
  DocumentReference,
  getMeadowlarkIdForDocumentReference,
  getMeadowlarkIdForSuperclassInfo,
  BlockingDocument,
} from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import type { PoolClient, QueryResult } from 'pg';
import {
  documentInsertOrUpdateSql,
  findAliasIdsForDocumentByDocumentUuidSql,
  deleteAliasesForDocumentSql,
  insertAliasSql,
  deleteOutboundReferencesOfDocumentSql,
  insertOutboundReferencesSql,
  findReferringDocumentInfoForErrorReportingSql,
} from './SqlHelper';
import { validateReferences } from './ReferenceValidation';

const moduleName = 'postgresql.repository.Update';

export async function updateDocumentByDocumentUuid(updateRequest: UpdateRequest, client: PoolClient): Promise<UpdateResult> {
  const {
    meadowlarkId,
    documentUuid,
    resourceInfo,
    documentInfo,
    edfiDoc,
    validateDocumentReferencesExist,
    traceId,
    security,
  } = updateRequest;
  Logger.info(`${moduleName}.updateDocumentById ${documentUuid}`, traceId);
  let updateResult: UpdateResult = { response: 'UNKNOWN_FAILURE' };

  const outboundRefs: MeadowlarkId[] = documentInfo.documentReferences.map((dr: DocumentReference) =>
    getMeadowlarkIdForDocumentReference(dr),
  );

  try {
    await client.query('BEGIN');

    const recordExistsResult = await client.query(findAliasIdsForDocumentByDocumentUuidSql(documentUuid));

    if (recordExistsResult.rowCount === 0) {
      updateResult = { response: 'UPDATE_FAILURE_NOT_EXISTS' };
      return updateResult;
    }
    const existingMeadowlardId: MeadowlarkId = recordExistsResult.rows[0].document_id;
    if (!resourceInfo.allowIdentityUpdates && existingMeadowlardId !== meadowlarkId) {
      updateResult = { response: 'UPDATE_FAILURE_IMMUTABLE_IDENTITY' };
      return updateResult;
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
          `${moduleName}.updateDocument: Inserting document documentUuid ${documentUuid} failed due to invalid references`,
          traceId,
        );

        const referringDocuments = await client.query(findReferringDocumentInfoForErrorReportingSql([existingMeadowlardId]));

        const blockingDocuments: BlockingDocument[] = referringDocuments.rows.map((document) => ({
          resourceName: document.resource_name,
          meadowlarkId: document.document_id,
          documentUuid: document.document_uuid,
          projectName: document.project_name,
          resourceVersion: document.resource_version,
        }));

        updateResult = {
          response: 'UPDATE_FAILURE_REFERENCE',
          failureMessage: { error: { message: 'Reference validation failed', failures } },
          blockingDocuments,
        };
        await client.query('ROLLBACK');
        return updateResult;
      }
    }

    // Perform the document update
    const documentSql: string = documentInsertOrUpdateSql(
      { id: meadowlarkId, documentUuid, resourceInfo, documentInfo, edfiDoc, validateDocumentReferencesExist, security },
      false,
    );
    const result: QueryResult = await client.query(documentSql);
    // Delete existing alias using the old meadowlarkId
    const deleteAliaseSql = deleteAliasesForDocumentSql(existingMeadowlardId);
    // Delete existing values from the aliases table
    await client.query(deleteAliaseSql);

    // Perform insert of alias ids
    await client.query(insertAliasSql(documentUuid, meadowlarkId, meadowlarkId));
    if (documentInfo.superclassInfo != null) {
      const superclassAliasId: MeadowlarkId = getMeadowlarkIdForSuperclassInfo(documentInfo.superclassInfo) as MeadowlarkId;
      await client.query(insertAliasSql(documentUuid, meadowlarkId, superclassAliasId));
    }

    // Delete existing references in references table (by old meadowlarkId)
    Logger.debug(
      `${moduleName}.upsertDocument: Deleting references for document meadowlarkId ${existingMeadowlardId}`,
      traceId,
    );
    await client.query(deleteOutboundReferencesOfDocumentSql(existingMeadowlardId));

    // Adding descriptors to outboundRefs for reference checking
    const descriptorOutboundRefs = documentInfo.descriptorReferences.map((dr: DocumentReference) =>
      getMeadowlarkIdForDocumentReference(dr),
    );
    outboundRefs.push(...descriptorOutboundRefs);

    // Perform insert of references to the references table
    // eslint-disable-next-line no-restricted-syntax
    for (const ref of outboundRefs) {
      Logger.debug(
        `${moduleName}.upsertDocument: Inserting reference meadowlarkId ${ref} for document meadowlarkId ${meadowlarkId}`,
        ref,
      );
      await client.query(insertOutboundReferencesSql(meadowlarkId, ref as MeadowlarkId));
    }

    await client.query('COMMIT');

    updateResult =
      result.rowCount && result.rowCount > 0
        ? {
            response: 'UPDATE_SUCCESS',
          }
        : {
            response: 'UPDATE_FAILURE_NOT_EXISTS',
          };
  } catch (e) {
    await client.query('ROLLBACK');
    Logger.error(`${moduleName}.upsertDocument`, traceId, e);
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }

  return updateResult;
}
