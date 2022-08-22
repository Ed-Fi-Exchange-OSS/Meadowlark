// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient, QueryResult } from 'pg';
import {
  UpsertResult,
  UpsertRequest,
  Logger,
  DocumentReference,
  documentIdForDocumentReference,
  documentIdForSuperclassInfo,
} from '@edfi/meadowlark-core';

import {
  deleteReferencesSql,
  documentInsertOrUpdateSql,
  referencesInsertSql,
  deleteExistenceIdsByDocumentId,
  existenceInsertSql,
  existenceIdsForDocument,
} from './SqlHelper';
import { validateReferences } from './ReferenceValidation';

export async function upsertDocument(
  { id, resourceInfo, documentInfo, edfiDoc, validate, traceId, security }: UpsertRequest,
  client: PoolClient,
): Promise<UpsertResult> {
  let upsertResult: UpsertResult = { response: 'UNKNOWN_FAILURE' };

  let recordExistsResult: QueryResult;
  let documentUpsertSql: string;
  let isInsert: boolean;

  const outRefs = documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr));

  try {
    await client.query('BEGIN');

    recordExistsResult = await client.query(existenceIdsForDocument(id));
    isInsert = recordExistsResult.rowCount === 0;

    documentUpsertSql = documentInsertOrUpdateSql({ id, resourceInfo, documentInfo, edfiDoc, validate, security }, isInsert);

    if (validate) {
      const failures = await validateReferences(
        documentInfo.documentReferences,
        documentInfo.descriptorReferences,
        outRefs,
        client,
        traceId,
      );
      // Abort on validation failure
      if (failures.length > 0) {
        Logger.debug(
          `postgresql.repository.Upsert.upsertDocument: Inserting document id ${id} failed due to invalid references`,
          traceId,
        );
        upsertResult = {
          response: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE',
          failureMessage: `Reference validation failed: ${failures.join(',')}`,
        };
        await client.query('ROLLBACK');
        return upsertResult;
      }
    }

    // Perform the document upsert
    Logger.debug(`postgresql.repository.Upsert.upsertDocument: Upserting document id ${id}`, traceId);
    await client.query(documentUpsertSql);

    // Delete existing values from the existence table
    await client.query(deleteExistenceIdsByDocumentId(id));

    // Perform insert of existence ids
    await client.query(existenceInsertSql(id, id));
    if (documentInfo.superclassInfo != null) {
      const existenceId = documentIdForSuperclassInfo(documentInfo.superclassInfo);
      await client.query(existenceInsertSql(id, existenceId));
    }

    // Delete existing references in references table
    Logger.debug(`postgresql.repository.Upsert.upsertDocument: Deleting references for document id ${id}`, traceId);
    await client.query(deleteReferencesSql(id));

    // Adding descriptors to outRefs for reference checking
    const descriptorOutRefs = documentInfo.descriptorReferences.map((dr: DocumentReference) =>
      documentIdForDocumentReference(dr),
    );
    outRefs.push(...descriptorOutRefs);

    // Perform insert of references to the references table
    // eslint-disable-next-line no-restricted-syntax
    for (const ref of outRefs) {
      Logger.debug(`postgresql.repository.Upsert.upsertDocument: Inserting reference id ${ref} for document id ${id}`, ref);
      await client.query(referencesInsertSql(id, ref));
      await client.query(existenceInsertSql(id, ref));
    }

    await client.query('COMMIT');
    upsertResult.response = isInsert ? 'INSERT_SUCCESS' : 'UPDATE_SUCCESS';
  } catch (e) {
    Logger.error('postgresql.repository.Upsert.upsertDocument', traceId, e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }

  return upsertResult;
}
