// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  UpdateResult,
  UpdateRequest,
  DocumentReference,
  documentIdForDocumentReference,
  documentIdForSuperclassInfo,
  BlockingDocument,
} from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import type { PoolClient, QueryResult } from 'pg';
import {
  documentInsertOrUpdateSql,
  findAliasIdsForDocumentSql,
  deleteAliasesForDocumentSql,
  insertAliasSql,
  deleteOutboundReferencesOfDocumentSql,
  insertOutboundReferencesSql,
  findReferringDocumentInfoForErrorReportingSql,
} from './SqlHelper';
import { validateReferences } from './ReferenceValidation';

const moduleName = 'postgresql.repository.Update';

export async function updateDocumentById(
  { id, resourceInfo, documentInfo, edfiDoc, validate, traceId, security }: UpdateRequest,
  client: PoolClient,
): Promise<UpdateResult> {
  Logger.info(`${moduleName}.updateDocumentById ${id}`, traceId);

  let updateResult: UpdateResult = { response: 'UNKNOWN_FAILURE' };

  const outboundRefs: string[] = documentInfo.documentReferences.map((dr: DocumentReference) =>
    documentIdForDocumentReference(dr),
  );

  try {
    await client.query('BEGIN');

    const recordExistsResult = await client.query(findAliasIdsForDocumentSql(id));

    if (recordExistsResult.rowCount === 0) {
      updateResult = { response: 'UPDATE_FAILURE_NOT_EXISTS' };
      return updateResult;
    }

    if (validate) {
      const failures = await validateReferences(
        documentInfo.documentReferences,
        documentInfo.descriptorReferences,
        outboundRefs,
        client,
        traceId,
      );
      // Abort on validation failure
      if (failures.length > 0) {
        Logger.debug(`${moduleName}.updateDocument: Inserting document id ${id} failed due to invalid references`, traceId);

        const referringDocuments = await client.query(findReferringDocumentInfoForErrorReportingSql([id]));

        const blockingDocuments: BlockingDocument[] = referringDocuments.rows.map((document) => ({
          resourceName: document.resource_name,
          documentId: document.document_id,
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
      { id, resourceInfo, documentInfo, edfiDoc, validate, security },
      false,
    );
    const result: QueryResult = await client.query(documentSql);

    // Delete existing values from the aliases table
    await client.query(deleteAliasesForDocumentSql(id));

    // Perform insert of alias ids
    await client.query(insertAliasSql(id, id));
    if (documentInfo.superclassInfo != null) {
      const superclassAliasId = documentIdForSuperclassInfo(documentInfo.superclassInfo);
      await client.query(insertAliasSql(id, superclassAliasId));
    }

    // Delete existing references in references table
    Logger.debug(`${moduleName}.upsertDocument: Deleting references for document id ${id}`, traceId);
    await client.query(deleteOutboundReferencesOfDocumentSql(id));

    // Adding descriptors to outboundRefs for reference checking
    const descriptorOutboundRefs = documentInfo.descriptorReferences.map((dr: DocumentReference) =>
      documentIdForDocumentReference(dr),
    );
    outboundRefs.push(...descriptorOutboundRefs);

    // Perform insert of references to the references table
    // eslint-disable-next-line no-restricted-syntax
    for (const ref of outboundRefs) {
      Logger.debug(`${moduleName}.upsertDocument: Inserting reference id ${ref} for document id ${id}`, ref);
      await client.query(insertOutboundReferencesSql(id, ref));
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
