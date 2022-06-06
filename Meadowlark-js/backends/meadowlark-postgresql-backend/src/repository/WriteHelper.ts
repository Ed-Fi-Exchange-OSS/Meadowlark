// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Client } from 'pg';
import format from 'pg-format';
import R from 'ramda';
import { DocumentReference, Logger } from '@edfi/meadowlark-core';

export async function validateReferenceEntitiesExist(
  referenceIds: string[],
  client: Client,
  traceId: string,
): Promise<string[]> {
  const failureMessages: string[] = [];
  const sqlQuery = `SELECT id FROM meadowlark.documents WHERE id IN (${referenceIds.toString()})`;
  const referencesInDb = await client.query(sqlQuery);

  if (referencesInDb.rows.length !== referenceIds.length) {
    Logger.debug('postgres.repository.Upsert.insertDocument: documentReferences not found', traceId);

    const outRefIdsNotInDb: string[] = R.difference(referenceIds, referencesInDb.rows);

    // Gets the array indexes of the missing references, for the documentOutRefs array
    const arrayIndexesOfMissing: number[] = outRefIdsNotInDb.map((outRefId) => referenceIds.indexOf(outRefId));

    // Pick out the DocumentReferences of the missing from the entire array of DocumentReferences,
    const pickedDocumentReferencesOfMissing: DocumentReference[] = R.props(
      arrayIndexesOfMissing as any[],
      referenceIds as any[],
    );

    pickedDocumentReferencesOfMissing.map((reference) =>
      failureMessages.push(
        `Resource ${reference.resourceName} is missing identity ${JSON.stringify(reference.documentIdentity)}`,
      ),
    );
  }
  return failureMessages;
}

// export async function updateDocumentById(
//   { id, resourceInfo, documentInfo, edfiDoc, validate },
//   client: Client,
// ): Promise<UpsertResult> {
//   try {
//     await client.query('BEGIN');

//     const outRefs = documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr));

//     // Perform the document upsert
//     Logger.debug(`postgres.repository.Upsert.upsertDocument: Updating document id ${id}`, traceId);
//     const pkValueResult = await client.query(updateDocumentSql);

//     // eslint-disable-next-line no-underscore-dangle
//     const newlyCreatedDocumentId = pkValueResult.rows[0]._pk;
//     outRefs.forEach((ref: string) => {
//       const referenceValues = [newlyCreatedDocumentId, ref];
//       const insertReferencesSql = format(
//         'INSERT INTO meadowlark.references COLUMNS (_pk, reference_from) VALUES(%L, L%);',
//         referenceValues,
//       );
//       client.query(insertReferencesSql);
//     });

//     await client.query('COMMIT');
//     upsertResult.response = 'INSERT_SUCCESS';
//   } catch (e) {
//     Logger.error('postgres.repository.Upsert.upsertDocument', traceId, e);
//     await client.query('ROLLBACK');
//     return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
//   }
//   return upsertResult;
// }

export async function getDocumentSql(
  { id, resourceInfo, documentInfo, edfiDoc, validate },
  isInsert: boolean,
): Promise<string> {
  const documentValues = [
    id,
    JSON.stringify(documentInfo.documentIdentity),
    resourceInfo.projectName,
    resourceInfo.resourceName,
    resourceInfo.resourceVersion,
    resourceInfo.isDescriptor,
    validate,
    edfiDoc,
  ];

  let documentSql;

  if (isInsert) {
    documentSql = format(
      'INSERT INTO meadowlark.documents' +
        ' (id, document_identity, project_name, resource_name, resource_version, is_descriptor, validated, edfi_doc)' +
        ' VALUES (%L)' +
        ' RETURNING _pk;',
      documentValues,
    );
  } else {
    documentSql = format(
      'UPDATE meadowlark.documents' +
        ' SET' +
        ' id = %L,' +
        ' document_identity = %L,' +
        ' project_name = %L,' +
        ' resource_name = %L,' +
        ' resource_version = %L,' +
        ' is_descriptor = %L,' +
        ' validated = %L,' +
        ' edfi_doc = %L' +
        ' WHERE meadowlark.documents.id = %1$L;',
      documentValues[0],
      documentValues[1],
      documentValues[2],
      documentValues[3],
      documentValues[4],
      documentValues[5],
      documentValues[6],
      documentValues[7],
    );
  }
  return documentSql;
}
