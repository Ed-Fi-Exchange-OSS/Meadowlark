// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { UpdateResult, Logger, UpdateRequest } from '@edfi/meadowlark-core';
import { Client } from 'pg';
import { getDocumentSql } from './WriteHelper';

export async function updateDocumentById(
  { id, resourceInfo, documentInfo, edfiDoc, validate, traceId }: UpdateRequest,
  client: Client,
): Promise<UpdateResult> {
  const updateResult: UpdateResult = { response: 'UNKNOWN_FAILURE' };

  // let outRefs;

  try {
    await client.query('BEGIN');
    // if (validate) {
    // outRefs = documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr));
    //   const failures = await validateReferenceEntitiesExist(outRefs, client, traceId);
    //   // Abort on validation failure
    //   if (failures.length > 0) {
    //     Logger.debug(
    //       `mongodb.repository.Upsert.updateDocumentById: Updating document id ${id} failed due to invalid references`,
    //       traceId,
    //     );
    //     updateResult = {
    //       response: 'UPDATE_FAILURE_REFERENCE',
    //       failureMessage: `Reference validation failed: ${failures.join(',')}`,
    //     };
    //     await client.query('ROLLBACK');
    //     return updateResult;
    //   }
    // }

    // Perform the document update
    Logger.debug(`postgresql.repository.Upsert.updateDocumentById: Updating document id ${id}`, traceId);

    const documentSql = await getDocumentSql({ id, resourceInfo, documentInfo, edfiDoc, validate }, false);
    const result = await client.query(documentSql);
    await client.query('COMMIT');

    updateResult.response = result.rowCount > 0 ? 'UPDATE_SUCCESS' : 'UPDATE_FAILURE_NOT_EXISTS';
  } catch (e) {
    await client.query('ROLLBACK');
    Logger.error('postgres.repository.Upsert.upsertDocument', traceId, e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }

  return updateResult;
}
