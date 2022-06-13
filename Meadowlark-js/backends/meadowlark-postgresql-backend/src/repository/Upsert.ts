// // SPDX-License-Identifier: Apache-2.0
// // Licensed to the Ed-Fi Alliance under one or more agreements.
// // The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// // See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient, QueryResult } from 'pg';
import { UpsertResult, UpsertRequest, Logger } from '@edfi/meadowlark-core';
import { getDocumentInsertOrUpdateSql, getRecordExistsSql } from './QueryHelper';

export async function upsertDocument(
  { id, resourceInfo, documentInfo, edfiDoc, validate, traceId, security }: UpsertRequest,
  client: PoolClient,
): Promise<UpsertResult> {
  const upsertResult: UpsertResult = { response: 'UNKNOWN_FAILURE' };

  let recordExistsResult: QueryResult;
  // let outRefs;
  let documentSql: string;
  let isInsert: boolean;

  try {
    recordExistsResult = await client.query(await getRecordExistsSql(id));

    isInsert = !recordExistsResult.rowCount || recordExistsResult.rowCount === 0;

    documentSql = await getDocumentInsertOrUpdateSql(
      { id, resourceInfo, documentInfo, edfiDoc, validate, security },
      isInsert,
    );
  } catch (e) {
    Logger.error(e, traceId);
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }

  try {
    await client.query('BEGIN');

    // TODO - Reference validation to be added with RND-243
    // if (validate) {
    //   outRefs = documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr));
    //   const failures = await validateReferenceEntitiesExist(outRefs, client, traceId);

    //   // Abort on validation failure
    //   if (failures.length > 0) {
    //     Logger.debug(
    //       `Postgres.repository.Upsert.upsertDocument: Inserting document id ${id} failed due to invalid references`,
    //       traceId,
    //     );

    //     upsertResult = {
    //       response: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE',
    //       failureMessage: `Reference validation failed: ${failures.join(',')}`,
    //     };

    //     await client.query('ROLLBACK');
    //     return upsertResult;
    //   }
    // }
    // Perform the document upsert
    Logger.debug(`postgres.repository.Upsert.upsertDocument: Upserting document id ${id}`, traceId);
    await client.query(documentSql);

    // TODO - Reference validation to be added with RND-243
    // Perform references insert, if reference validation is turned on
    // if (validate) {
    // eslint-disable-next-line no-underscore-dangle
    // const newlyCreatedDocumentId = pkValueResult.rows[0]._pk;
    // outRefs.forEach((ref: string) => {
    // Logger.debug('postgres.repository.Upsert.upsertDocument', pkValueResult, ref);
    //   const referenceValues = [newlyCreatedDocumentId, ref];
    //   const insertReferencesSql = format(
    //     'INSERT INTO meadowlark.references COLUMNS (_pk, reference_from) VALUES(%L, L%);',
    //     referenceValues,
    // });
    //   client.query(insertReferencesSql);
    // });
    // }

    await client.query('COMMIT');
    upsertResult.response = isInsert ? 'INSERT_SUCCESS' : 'UPDATE_SUCCESS';
  } catch (e) {
    Logger.error('postgres.repository.Upsert.upsertDocument', traceId, e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }

  return upsertResult;
}
