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

import format from 'pg-format';
import { deleteReferencesSql, documentInsertOrUpdateSql, checkDocumentExistsSql, referencesInsertSql } from './SqlHelper';
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

    recordExistsResult = await client.query(checkDocumentExistsSql(id));
    isInsert = !recordExistsResult.rows[0].exists;

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

    if (documentInfo.superclassInfo != null) {
      const superClassId = documentIdForSuperclassInfo(documentInfo.superclassInfo);
      const existenceValues = [id, superClassId];
      const sqlString = format(
        `INSERT INTO meadowlark.existence
      (sub_class_identifier, super_class_identifier)
      VALUES (%L)`,
        existenceValues,
      );
      await client.query(sqlString);
    }

    // Delete existing references in references table
    Logger.debug(`postgresql.repository.Upsert.upsertDocument: Deleting references for document id ${id}`, traceId);
    await client.query(deleteReferencesSql(id));

    // Perform insert of references to the references table
    outRefs.forEach(async (ref: string) => {
      Logger.debug(`postgresql.repository.Upsert.upsertDocument: Inserting reference id ${ref} for document id ${id}`, ref);
      await client.query(referencesInsertSql(id, ref));
    });

    await client.query('COMMIT');
    upsertResult.response = isInsert ? 'INSERT_SUCCESS' : 'UPDATE_SUCCESS';
  } catch (e) {
    Logger.error('postgresql.repository.Upsert.upsertDocument', traceId, e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }

  return upsertResult;
}
