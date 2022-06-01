// // SPDX-License-Identifier: Apache-2.0
// // Licensed to the Ed-Fi Alliance under one or more agreements.
// // The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// // See the LICENSE and NOTICES files in the project root for more information.

import { Client } from 'pg';
import format from 'pg-format';
import {
  UpsertResult,
  UpsertRequest,
  Logger,
  DocumentReference,
  documentIdForDocumentReference,
} from '@edfi/meadowlark-core';
import { validateReferenceEntitiesExist } from './WriteHelper';
// import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
// import { getCollection } from './Db';
// import { asUpsert, meadowlarkDocumentFrom, onlyReturnId, validateReferences } from './WriteHelper';

export async function upsertDocument(
  { id, resourceInfo, documentInfo, edfiDoc, validate, traceId }: UpsertRequest,
  client: Client,
): Promise<UpsertResult> {
  let upsertResult: UpsertResult = { response: 'UNKNOWN_FAILURE' };

  let recordExistsResult;
  try {
    const recordExistsSql = format('SELECT _pk FROM meadowlark.documents WHERE id = %L;', [id]);
    recordExistsResult = await client.query(recordExistsSql);
  } catch (e) {
    Logger.error(e, traceId);
  }

  // eslint-disable-next-line no-underscore-dangle
  if (recordExistsResult.rowCount > 0) {
    // This is an update
    // TODO@SAA Add update functionality
  } else {
    // This is an insert
    const insertDocumentValues = [
      id,
      documentInfo.documentIdentity,
      resourceInfo.projectName,
      resourceInfo.resourceName,
      resourceInfo.resourceVersion,
      resourceInfo.isDescriptor,
      validate,
      edfiDoc,
    ];

    const insertDocumentSQL = format(
      'INSERT INTO meadowlark.documents' +
        ' (id, document_identity, project_name, resource_name, resource_version, is_descriptor, validated, edfi_doc)' +
        ' VALUES (%L)' +
        ' RETURNING _pk;',
      insertDocumentValues,
    );

    try {
      await client.query('BEGIN');

      const outRefs = documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr));
      if (validate) {
        const failures = await validateReferenceEntitiesExist(outRefs, client, traceId);

        // Abort on validation failure
        if (failures.length > 0) {
          Logger.debug(
            `Postgres.repository.Upsert.upsertDocument: Inserting document id ${id} failed due to invalid references`,
            traceId,
          );

          upsertResult = {
            response: 'INSERT_FAILURE_REFERENCE',
            failureMessage: `Reference validation failed: ${failures.join(',')}`,
          };

          await client.query('ROLLBACK');
          return upsertResult;
        }
      }
      // Perform the document upsert
      Logger.debug(`postgres.repository.Upsert.upsertDocument: Upserting document id ${id}`, traceId);
      const pkValueResult = await client.query(insertDocumentSQL);

      // eslint-disable-next-line no-underscore-dangle
      const newlyCreatedDocumentId = pkValueResult.rows[0]._pk;
      outRefs.forEach((ref: string) => {
        const referenceValues = [newlyCreatedDocumentId, ref];
        const insertReferencesSql = format(
          'INSERT INTO meadowlark.references COLUMNS (_pk, reference_from) VALUES(%L, L%);',
          referenceValues,
        );
        client.query(insertReferencesSql);
      });

      await client.query('COMMIT');
      upsertResult.response = 'INSERT_SUCCESS';
    } catch (e) {
      Logger.error('postgres.repository.Upsert.upsertDocument', traceId, e);
      await client.query('ROLLBACK');
      return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
    } finally {
      client.release();
    }
  }

  return upsertResult;
}
