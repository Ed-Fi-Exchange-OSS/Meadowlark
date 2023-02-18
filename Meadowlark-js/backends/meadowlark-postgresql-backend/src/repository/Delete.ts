// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import type { DeleteResult, DeleteRequest, BlockingDocument } from '@edfi/meadowlark-core';
import type { PoolClient, QueryResult } from 'pg';
import {
  deleteDocumentByIdSql,
  deleteOutboundReferencesOfDocumentSql,
  findReferringDocumentInfoForErrorReportingSql,
  deleteAliasesForDocumentSql,
  findAliasIdsForDocumentSql,
  findReferencingDocumentIdsSql,
} from './SqlHelper';

const moduleName = 'postgresql.repository.Delete';

export async function deleteDocumentById(
  { meadowlarkId, validate, traceId }: DeleteRequest,
  client: PoolClient,
): Promise<DeleteResult> {
  Logger.debug(`${moduleName}.deleteDocumentById ${meadowlarkId}`, traceId);

  let deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE', failureMessage: '' };

  try {
    await client.query('BEGIN');

    if (validate) {
      // Find the alias ids for the document to be deleted
      const documentAliasIdsResult: QueryResult = await client.query(findAliasIdsForDocumentSql(meadowlarkId));

      // All documents have alias ids. If no alias ids were found, the document doesn't exist
      if (documentAliasIdsResult.rowCount == null || documentAliasIdsResult.rowCount === 0) {
        await client.query('ROLLBACK');
        Logger.debug(`${moduleName}.deleteDocumentById: Document meadowlarkId ${meadowlarkId} does not exist`, traceId);
        deleteResult = { response: 'DELETE_FAILURE_NOT_EXISTS' };
        return deleteResult;
      }

      // Extract from the query result
      const documentAliasIds: string[] = documentAliasIdsResult.rows.map((ref) => ref.alias_id);

      // Find any documents that reference this document, either it's own id or an alias
      const referenceResult: QueryResult<any> = await client.query(findReferencingDocumentIdsSql(documentAliasIds));

      if (referenceResult.rows == null) {
        await client.query('ROLLBACK');
        const errorMessage = `${moduleName}.deleteDocumentById: Error determining documents referenced by ${meadowlarkId}, a null result set was returned`;
        deleteResult.failureMessage = errorMessage;
        Logger.error(errorMessage, traceId);
        return deleteResult;
      }

      const references = referenceResult?.rows.filter((ref) => ref.document_id !== meadowlarkId);

      // If this document is referenced, it's a validation failure
      if (references.length > 0) {
        Logger.debug(
          `${moduleName}.deleteDocumentById: Deleting document meadowlarkId ${meadowlarkId} failed due to existing references`,
          traceId,
        );

        // Get the information of up to five referring documents for failure message purposes
        const referenceIds = references.map((ref) => ref.parent_document_id);
        const referringDocuments = await client.query(findReferringDocumentInfoForErrorReportingSql(referenceIds));

        if (referringDocuments.rows == null) {
          await client.query('ROLLBACK');
          const errorMessage = `${moduleName}.deleteDocumentById Error retrieving documents referenced by ${meadowlarkId}, a null result set was returned`;
          deleteResult.failureMessage = errorMessage;
          Logger.error(errorMessage, traceId);
          return deleteResult;
        }

        const blockingDocuments: BlockingDocument[] = referringDocuments.rows.map((document) => ({
          resourceName: document.resource_name,
          meadowlarkId: document.document_id,
          projectName: document.project_name,
          resourceVersion: document.resource_version,
        }));

        deleteResult = {
          response: 'DELETE_FAILURE_REFERENCE',
          blockingDocuments,
        };
        await client.query('ROLLBACK');
        return deleteResult;
      }
    }

    // Perform the document delete
    Logger.debug(`${moduleName}.deleteDocumentById: Deleting document meadowlarkId ${meadowlarkId}`, traceId);
    const deleteQueryResult: QueryResult = await client.query(deleteDocumentByIdSql(meadowlarkId));

    if (deleteQueryResult.rowCount === 0 || deleteQueryResult.rows == null) {
      await client.query('ROLLBACK');
      deleteResult.failureMessage = `deleteDocumentById: Failure deleting document ${meadowlarkId}, a null result was returned`;
      return deleteResult;
    }

    deleteResult =
      deleteQueryResult.rows[0].count === '0' ? { response: 'DELETE_FAILURE_NOT_EXISTS' } : { response: 'DELETE_SUCCESS' };

    // Delete references where this is the parent document
    Logger.debug(
      `${moduleName}.deleteDocumentById Deleting references with meadowlarkId ${meadowlarkId} as parent meadowlarkId`,
      traceId,
    );
    await client.query(deleteOutboundReferencesOfDocumentSql(meadowlarkId));

    // Delete this document from the aliases table
    Logger.debug(`${moduleName}.deleteDocumentById Deleting alias entries with meadowlarkId ${meadowlarkId}`, traceId);
    await client.query(deleteAliasesForDocumentSql(meadowlarkId));

    await client.query('COMMIT');
  } catch (e) {
    Logger.error(`${moduleName}.deleteDocumentById`, traceId, e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: '' };
  }
  return deleteResult;
}
