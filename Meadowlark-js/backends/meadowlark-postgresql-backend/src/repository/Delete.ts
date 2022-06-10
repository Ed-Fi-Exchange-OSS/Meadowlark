// // SPDX-License-Identifier: Apache-2.0
// // Licensed to the Ed-Fi Alliance under one or more agreements.
// // The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// // See the LICENSE and NOTICES files in the project root for more information.

import { DeleteResult, Logger, DeleteRequest } from '@edfi/meadowlark-core';
import { Client } from 'pg';
import { deleteDocumentByIdSql } from './QueryHelper';

// This function should only be used for testing, it will clear out all data from both documents and references tables
export async function deleteAll(client: Client): Promise<DeleteResult> {
  const deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE' };

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM meadowlark.documents;');
    await client.query('DELETE FROM meadowlark.references;');
    await client.query('COMMIT');
    deleteResult.response = 'DELETE_SUCCESS';
  } catch (e) {
    Logger.error('postgres.repository.Upsert.upsertDocument', 'DELETE_ALL', e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    client.release();
  }

  return deleteResult;
}

export async function deleteDocumentById({ id, validate, traceId }: DeleteRequest, client: Client): Promise<DeleteResult> {
  const deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE' };

  try {
    // Determine if the record exists
    // const existsQuery = client.query(await getRecordExistsSql(id));

    // const recordExists = existsQuery.rowCount && existsQuery.rowCount > 0;

    // if (recordExists) {
    //   deleteResult.response = 'DELETE_FAILURE_NOT_EXISTS';
    //   return deleteResult;
    // }

    client.query('BEGIN');

    if (validate) {
      //         // Check for any references to the document to be deleted
      //         const anyReferences: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
      //           onlyDocumentsReferencing(id),
      //           onlyReturnId(session),
      //         );
      //         // Abort on validation failure
      //         if (anyReferences) {
      //           Logger.debug(
      //             `mongodb.repository.Delete.deleteDocumentById: Deleting document id ${id} failed due to existing references`,
      //             traceId,
      //           );
      //           // Get the DocumentIdentities of up to five referring documents for failure message purposes
      //           const referringDocuments = await mongoCollection.find(onlyDocumentsReferencing(id), limitFive(session)).toArray();
      //           const failures: string[] = referringDocuments.map(
      //             (document) => `Resource ${document.resourceName} with identity '${JSON.stringify(document.documentIdentity)}'`,
      //           );
      // deleteResult = {
      //   result: 'DELETE_FAILURE_REFERENCE',
      //   failureMessage: `Delete failed due to existing references to document: ${failures.join(',')}`,
      // };
      //           await session.abortTransaction();
      //           return;
      //         }
    }
    // Perform the document delete
    Logger.debug(`postgresql.repository.Delete.deleteDocumentById: Deleting document id ${id}`, traceId);
    const deleteQueryResult = await client.query(await deleteDocumentByIdSql(id));
    deleteResult.response = deleteQueryResult.rows[0].count === '0' ? 'DELETE_FAILURE_NOT_EXISTS' : 'DELETE_SUCCESS';
    client.query('COMMIT');
  } catch (e) {
    Logger.error('postgresql.repository.Delete.deleteDocumentById', traceId, e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }
  return deleteResult;
}
