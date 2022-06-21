// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DeleteResult, Logger, DeleteRequest } from '@edfi/meadowlark-core';
import type { PoolClient, QueryResult } from 'pg';
import {
  deleteDocumentByIdSql,
  getCheckIsReferencedDocumentSql,
  getDeleteReferencesSql,
  getReferencedByDocumentSql,
} from './QueryHelper';

export async function deleteDocumentById(
  { id, validate, traceId }: DeleteRequest,
  client: PoolClient,
): Promise<DeleteResult> {
  let deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE' };

  try {
    client.query('BEGIN');

    if (validate) {
      // Check for any references to the document to be deleted
      const referencesResult = await client.query(getCheckIsReferencedDocumentSql(id));

      // Abort on validation failure
      if (referencesResult.rows[0].exists) {
        Logger.debug(
          `postgres.repository.Delete.deleteDocumentById: Deleting document id ${id} failed due to existing references`,
          traceId,
        );

        // Get the DocumentIdentities of up to five referring documents for failure message purposes
        const referringDocuments = await client.query(getReferencedByDocumentSql(id));
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
    await client.query(getDeleteReferencesSql(id));

    client.query('COMMIT');
  } catch (e) {
    Logger.error('postgresql.repository.Delete.deleteDocumentById', traceId, e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }
  return deleteResult;
}
