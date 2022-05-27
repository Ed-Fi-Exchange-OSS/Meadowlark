// // SPDX-License-Identifier: Apache-2.0
// // Licensed to the Ed-Fi Alliance under one or more agreements.
// // The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// // See the LICENSE and NOTICES files in the project root for more information.

import { Client } from 'pg';
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

  const recordExistsResult = client.query('SELECT _pk FROM meadowlark.documents WHERE id = $1)', [id]);

  // eslint-disable-next-line no-underscore-dangle
  if (recordExistsResult.rows[0]._pk) {
    // This is an update
    // TODO@SAA Add update functionality
  } else {
    // This is an insert
    const insertDocumentSQL =
      'INSERT INTO meadowlark.documents' +
      ' COLUMNS(id, document_identity, project_name, resource_name, resource_version, is_descriptor, validated, edfi_doc)' +
      ' VALUES ($1, $2, $3, $4, $5, $6, $7, $8)' +
      ' RETURNING _pk';

    const insertDocumentQuery = {
      text: insertDocumentSQL,
      values: [
        id,
        documentInfo.documentIdentity,
        resourceInfo.projectName,
        resourceInfo.resourceName,
        resourceInfo.resourceVersion,
        resourceInfo.isDescriptor,
        validate,
        edfiDoc,
      ],
      rowMode: 'array',
    };

    const insertReferencesSQL = 'INSERT INTO meadowlark.references COLUMNS (_pk, reference_from) VALUES($1, $2);';

    const insertReferencesQuery = {
      text: insertReferencesSQL,
      values: ['', ''],
      RowMode: 'array',
    };

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
      const pkValueResult = await client.query(insertDocumentQuery);

      // eslint-disable-next-line no-underscore-dangle
      const newlyCreatedDocumentId = pkValueResult.rows[0]._pk;
      outRefs.forEach((ref: string) => {
        insertReferencesQuery.values[0] = newlyCreatedDocumentId;
        insertReferencesQuery.values[1] = ref;
        client.query(insertReferencesQuery);
      });

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  return { response: 'UNKNOWN_FAILURE', failureMessage: '' };
}
