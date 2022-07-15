// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { documentIdForDocumentReference, DocumentReference, Logger } from '@edfi/meadowlark-core';
import { PoolClient } from 'pg';
import { checkForReferencesByDocumentId } from './SqlHelper';

export async function findReferencedDocumentIdsById(referenceIds: string[], client: PoolClient): Promise<string[]> {
  if (referenceIds.length === 0) {
    return [];
  }

  const existRef = await client.query(checkForReferencesByDocumentId(referenceIds));
  const references = existRef.rows.map((val) => val.existence_id);
  return references;
}

/**
 * Finds references in the document that are missing in the database
 *
 * @param refsInDb The document references that were actually found in the db (id property only)
 * @param documentOutRefs The document references extracted from the document, as id strings
 * @param documentReferences The DocumentReferences of the document
 * @returns Failure message listing out the resource name and identity of missing document references, if any.
 */
export function findMissingReferences(
  refsInDb: string[],
  documentOutRefs: string[],
  documentReferences: DocumentReference[],
): string[] {
  const outRefIdsNotInDb: string[] = R.difference(documentOutRefs, refsInDb);

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

  const referencesInDb = await findReferencedDocumentIdsById(outRefs, client);
  if (outRefs.length !== referencesInDb.length) {
    Logger.debug('postgresql.repository.WriteHelper.validateReferences: documentReferences not found', traceId);
    failureMessages.push(...findMissingReferences(referencesInDb, outRefs, documentReferences));
  }

  // Validate descriptor references
  const descriptorReferenceIds: string[] = descriptorReferences.map((dr: DocumentReference) =>
    documentIdForDocumentReference(dr),
  );
  const descriptorsInDb = await findReferencedDocumentIdsById(descriptorReferenceIds, client);
  if (descriptorReferenceIds.length !== descriptorsInDb.length) {
    Logger.debug('postgres.repository.WriteHelper.upsertDocument: descriptorReferences not found', traceId);
    failureMessages.push(...findMissingReferences(descriptorsInDb, descriptorReferenceIds, descriptorReferences));
  }
  return failureMessages;
}
