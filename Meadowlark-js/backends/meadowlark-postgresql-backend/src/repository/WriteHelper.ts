// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { documentIdForDocumentReference, DocumentReference, Logger } from '@edfi/meadowlark-core';
import { PoolClient, QueryResult } from 'pg';
import format from 'pg-format';
import { MeadowlarkDocumentId } from '../model/MeadowlarkDocument';

export async function findReferencesById(referenceIds: string[], client: PoolClient): Promise<MeadowlarkDocumentId[]> {
  if (referenceIds.length === 0) {
    return [];
  }
  // eslint-disable-next-line prettier/prettier
  // const ids = referenceIds.join(",");
  const sql = format('SELECT document_id FROM meadowlark.documents WHERE document_id IN (%L)', referenceIds);
  const response: QueryResult = await client.query(sql);

  return response.rows.map((val) => val.document_id) as MeadowlarkDocumentId[];
}

/**
 * Finds references in the document that are missing in the database
 *
 * @param refsInDb The document references that were actually found in the db (id property only)
 * @param documentOutRefs The document references extracted from the document, as id strings
 * @param documentInfo The DocumentInfo of the document
 * @returns Failure message listing out the resource name and identity of missing document references.
 */
export function findMissingReferences(
  refsInDb: MeadowlarkDocumentId[],
  documentOutRefs: string[],
  documentReferences: DocumentReference[],
): string[] {
  const idsOfRefsInDb: string[] = refsInDb.map((outRef) => outRef.id);
  const outRefIdsNotInDb: string[] = R.difference(documentOutRefs, idsOfRefsInDb);

  // Gets the array indexes of the missing references, for the documentOutRefs array
  const arrayIndexesOfMissing: number[] = outRefIdsNotInDb.map((outRefId) => documentOutRefs.indexOf(outRefId));

  // Pick out the DocumentReferences of the missing from the entire array of DocumentReferences,
  const pickedDocumentReferencesOfMissing: DocumentReference[] = R.props(
    arrayIndexesOfMissing as any[],
    documentReferences as any[],
  );

  return pickedDocumentReferencesOfMissing.map(
    (reference) => `Resource ${reference.resourceName} is missing identity ${JSON.stringify(reference.documentIdentity)}`,
  );
}

/**
 * Validate document and descriptor references
 *
 * @param documentReferences References for the document
 * @param descriptorReferences Descriptor references for the document
 * @param outRefs The list of ids for the document references
 * @param documentCollection The MongoDb collection the documents are in
 * @param session A MongoDb session with a transaction in progress
 * @param traceId The trace id from a service call
 * @returns A array of validation failure message, if any
 */
export async function validateReferences(
  documentReferences: DocumentReference[],
  descriptorReferences: DocumentReference[],
  outRefs: string[],
  client: PoolClient,
  traceId: string,
): Promise<string[]> {
  const failureMessages: string[] = [];

  const referencesInDb = await findReferencesById(outRefs, client);
  if (outRefs.length !== referencesInDb.length) {
    Logger.debug('postgresql.repository.Upsert.upsertDocument: documentReferences not found', traceId);
    failureMessages.push(...findMissingReferences(referencesInDb, outRefs, documentReferences));
  }

  // Validate descriptor references
  const descriptorReferenceIds: string[] = descriptorReferences.map((dr: DocumentReference) =>
    documentIdForDocumentReference(dr),
  );
  const descriptorsInDb = await findReferencesById(descriptorReferenceIds, client);
  if (descriptorReferenceIds.length !== descriptorsInDb.length) {
    Logger.debug('postgres.repository.Upsert.upsertDocument: descriptorReferences not found', traceId);
    failureMessages.push(...findMissingReferences(descriptorsInDb, descriptorReferenceIds, descriptorReferences));
  }
  return failureMessages;
}
