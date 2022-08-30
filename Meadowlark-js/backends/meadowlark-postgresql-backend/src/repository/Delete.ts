// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DeleteResult, Logger, DeleteRequest } from '@edfi/meadowlark-core';
import type { PoolClient, QueryResult } from 'pg';
import {
  deleteDocumentByIdSql,
  deleteOutboundReferencesOfDocumentSql,
  findReferringDocumentInfoForErrorReportingSql,
  deleteAliasesForDocumentSql,
  findAliasIdsForDocumentSql,
  findReferencingDocumentIdsSql,
} from './SqlHelper';

export async function deleteDocumentById(
  { id, validate, traceId }: DeleteRequest,
  client: PoolClient,
): Promise<DeleteResult> {
  let deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE' };

  try {
    await client.query('BEGIN');

    if (validate) {
      // Find the alias ids for the document to be deleted
      const documentAliasIdsResult: QueryResult = await client.query(findAliasIdsForDocumentSql(id));

      // All documents have alias ids. If no alias ids were found, the document doesn't exist
      if (documentAliasIdsResult?.rowCount === 0) {
        await client.query('ROLLBACK');
        deleteResult.response = 'DELETE_FAILURE_NOT_EXISTS';
        return deleteResult;
      }

      // Extract from the query result
      const documentAliasIds: string[] = documentAliasIdsResult.rows.map((ref) => ref.alias_id);

      // Find any documents that reference this document, either it's own id or an alias
      const referenceResult = await client.query(findReferencingDocumentIdsSql(documentAliasIds));
      const references = referenceResult.rows.filter((ref) => ref.document_id !== id);

      // If this document is referenced, it's a validation failure
      if (references.length > 0) {
        Logger.debug(
          `postgres.repository.Delete.deleteDocumentById: Deleting document id ${id} failed due to existing references`,
          traceId,
        );

        // Get the DocumentIdentities of up to five referring documents for failure message purposes
        const referenceIds = references.map((ref) => ref.parent_document_id);
        const referringDocuments = await client.query(findReferringDocumentInfoForErrorReportingSql(referenceIds));
        const failures: string[] = referringDocuments.rows.map(
          (document) => `Resource ${document.resource_name} with identity '${JSON.stringify(document.document_identity)}'`,
        );

        deleteResult = {
          response: 'DELETE_FAILURE_REFERENCE',
          failureMessage: `Delete failed due to existing references to document: ${failures.join(',')}`,
        };
        await client.query('ROLLBACK');
        return deleteResult;
      }
    }

    // Perform the document delete
    Logger.debug(`postgresql.repository.Delete.deleteDocumentById: Deleting document id ${id}`, traceId);
    const deleteQueryResult: QueryResult = await client.query(deleteDocumentByIdSql(id));
    deleteResult.response = deleteQueryResult.rows[0].count === '0' ? 'DELETE_FAILURE_NOT_EXISTS' : 'DELETE_SUCCESS';

    // Delete references where this is the parent document
    Logger.debug(`postgresql.repository.Delete.deleteDocumentById: Deleting references with id ${id} as parent id`, traceId);
    await client.query(deleteOutboundReferencesOfDocumentSql(id));

    // Delete this document from the aliases table
    Logger.debug(`postgresql.repository.Delete.deleteDocumentById: Deleting alias entries with id ${id}`, traceId);
    await client.query(deleteAliasesForDocumentSql(id));

    await client.query('COMMIT');
  } catch (e) {
    Logger.error('postgresql.repository.Delete.deleteDocumentById', traceId, e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }
  return deleteResult;
}
