// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import type { DeleteResult, DeleteRequest, BlockingDocument, MeadowlarkId } from '@edfi/meadowlark-core';
import type { PoolClient, QueryResult } from 'pg';
import {
  deleteDocumentByDocumentUuIdSql,
  deleteOutboundReferencesOfDocumentByMeadowlarkIdSql,
  findReferringDocumentInfoForErrorReportingSql,
  deleteAliasesForDocumentByMeadowlarkIdSql,
  findReferencingMeadowlarkIdsSql,
  findAliasMeadowlarkIdsForDocumentByDocumentUuidSql,
} from './SqlHelper';

const moduleName = 'postgresql.repository.Delete';

export async function deleteDocumentByDocumentUuid(
  { documentUuid, validateNoReferencesToDocument, traceId }: DeleteRequest,
  client: PoolClient,
): Promise<DeleteResult> {
  Logger.debug(`${moduleName}.deleteDocumentByDocumentUuid ${documentUuid}`, traceId);

  let deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE', failureMessage: '' };
  let meadowlarkId: MeadowlarkId = '' as MeadowlarkId;

  try {
    await client.query('BEGIN');
    // Find the alias meadowlarkIds for the document to be deleted
    const documentAliasIdsResult: QueryResult = await client.query(
      findAliasMeadowlarkIdsForDocumentByDocumentUuidSql(documentUuid),
    );
    // Each row contains documentUuid and corresponding meadowlarkId (meadowlark_id),
    // we just need the first row to return the meadowlark_id
    meadowlarkId =
      documentAliasIdsResult?.rowCount != null && documentAliasIdsResult.rowCount > 0
        ? documentAliasIdsResult.rows[0].meadowlark_id
        : ('' as MeadowlarkId);
    if (validateNoReferencesToDocument) {
      // All documents have alias meadowlarkIds. If no alias meadowlarkIds were found, the document doesn't exist
      if (meadowlarkId === '') {
        await client.query('ROLLBACK');
        Logger.debug(`${moduleName}.deleteDocumentByDocumentUuid: DocumentUuid ${documentUuid} does not exist`, traceId);
        deleteResult = { response: 'DELETE_FAILURE_NOT_EXISTS' };
        return deleteResult;
      }

      // Extract from the query result
      const documentAliasMeadowlarkIds: MeadowlarkId[] = documentAliasIdsResult.rows.map((ref) => ref.alias_meadowlark_id);

      // Find any documents that reference this document, either it's own meadowlarkId or an alias
      const referenceResult: QueryResult<any> = await client.query(
        findReferencingMeadowlarkIdsSql(documentAliasMeadowlarkIds),
      );

      if (referenceResult.rows == null) {
        await client.query('ROLLBACK');
        const errorMessage = `${moduleName}.deleteDocumentByDocumentUuid: Error determining documents referenced by ${documentUuid}, a null result set was returned`;
        deleteResult.failureMessage = errorMessage;
        Logger.error(errorMessage, traceId);
        return deleteResult;
      }

      const references = referenceResult?.rows.filter((ref) => ref.meadowlark_id !== meadowlarkId);

      // If this document is referenced, it's a validation failure
      if (references.length > 0) {
        Logger.debug(
          `${moduleName}.deleteDocumentByDocumentUuid: Deleting document meadowlarkId ${meadowlarkId} failed due to existing references`,
          traceId,
        );

        // Get the information of up to five referring documents for failure message purposes
        const referenceIds = references.map((ref) => ref.parent_meadowlark_id);
        const referringDocuments = await client.query(findReferringDocumentInfoForErrorReportingSql(referenceIds));

        if (referringDocuments.rows == null) {
          await client.query('ROLLBACK');
          const errorMessage = `${moduleName}.deleteDocumentByDocumentUuid Error retrieving documents referenced by ${meadowlarkId}, a null result set was returned`;
          deleteResult.failureMessage = errorMessage;
          Logger.error(errorMessage, traceId);
          return deleteResult;
        }

        const blockingDocuments: BlockingDocument[] = referringDocuments.rows.map((document) => ({
          documentUuid: document.documentUuid,
          meadowlarkId: document.meadowlark_id,
          resourceName: document.resource_name,
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
    Logger.debug(`${moduleName}.deleteDocumentByDocumentUuid: Deleting document documentUuid ${documentUuid}`, traceId);
    const deleteQueryResult: QueryResult = await client.query(deleteDocumentByDocumentUuIdSql(documentUuid));

    if (deleteQueryResult.rowCount === 0 || deleteQueryResult.rows == null) {
      await client.query('ROLLBACK');
      deleteResult.failureMessage = `deleteDocumentByDocumentUuid: Failure deleting document ${documentUuid}, a null result was returned`;
      return deleteResult;
    }

    deleteResult =
      deleteQueryResult.rows[0].count === '0' ? { response: 'DELETE_FAILURE_NOT_EXISTS' } : { response: 'DELETE_SUCCESS' };

    // Delete references where this is the parent document
    Logger.debug(
      `${moduleName}.deleteDocumentByDocumentUuid Deleting references with documentUuid ${documentUuid} as parent meadowlarkId`,
      traceId,
    );
    await client.query(deleteOutboundReferencesOfDocumentByMeadowlarkIdSql(meadowlarkId));

    // Delete this document from the aliases table
    Logger.debug(
      `${moduleName}.deleteDocumentByDocumentUuid Deleting alias entries with meadowlarkId ${meadowlarkId}`,
      traceId,
    );
    await client.query(deleteAliasesForDocumentByMeadowlarkIdSql(meadowlarkId));

    await client.query('COMMIT');
  } catch (e) {
    Logger.error(`${moduleName}.deleteDocumentByDocumentUuid`, traceId, e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: '' };
  }
  return deleteResult;
}
