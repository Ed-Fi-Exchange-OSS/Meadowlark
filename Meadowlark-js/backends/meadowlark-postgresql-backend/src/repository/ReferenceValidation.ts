// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { documentIdForDocumentReference, DocumentReference } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { PoolClient } from 'pg';
import { validateReferenceExistenceSql } from './SqlHelper';

const moduleName = 'postgresql.repository.ReferenceValidation';

/**
 * Finds whether the given reference ids are actually documents in the db.
 *
 * @param referenceIds The reference ids to check for existence in the db
 * @param client The PostgreSQL client used for querying the database
 * @returns The subset of the given reference ids that are actually documents in the db
 */
async function findReferencedDocumentIdsById(
  referenceIds: string[],
  traceId: string,
  client: PoolClient,
): Promise<string[]> {
  Logger.info(`${moduleName}.findReferencedDocumentIdsById`, traceId);

  if (referenceIds.length === 0) {
    return [];
  }

  const referenceExistenceResult = await client.query(validateReferenceExistenceSql(referenceIds));

  if (referenceExistenceResult.rows == null) {
    Logger.error(`${moduleName}.findReferencedDocumentIdsById Database error parsing references`, traceId);
    throw new Error(`${moduleName}.findReferencedDocumentIdsById Database error parsing references`);
  }

  return referenceExistenceResult.rows.map((val) => val.alias_id);
}

/**
 * Finds references in the document that are missing in the database
 *
 * @param refsInDb The document references that were actually found in the db (id property only)
 * @param documentOutboundRefs The document references extracted from the document, as id strings
 * @param documentReferences The DocumentReferences of the document
 * @returns Failure message listing out the resource name and identity of missing document references, if any.
 */
export function findMissingReferences(
  refsInDb: string[],
  documentOutboundRefs: string[],
  documentReferences: DocumentReference[],
): string[] {
  const outRefIdsNotInDb: string[] = R.difference(documentOutboundRefs, refsInDb);

  // Gets the array indexes of the missing references, for the documentOutboundRefs array
  const arrayIndexesOfMissing: number[] = outRefIdsNotInDb.map((outRefId) => documentOutboundRefs.indexOf(outRefId));

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
 * @param outboundRefs The list of ids for the document references
 * @param client The PostgreSQL client used for querying the database
 * @param traceId The trace id from a service call
 * @returns A array of validation failure message, if any
 */
export async function validateReferences(
  documentReferences: DocumentReference[],
  descriptorReferences: DocumentReference[],
  outboundRefs: string[],
  client: PoolClient,
  traceId: string,
): Promise<string[]> {
  const failureMessages: string[] = [];

  const referencesInDb = await findReferencedDocumentIdsById(outboundRefs, traceId, client);
  if (outboundRefs.length !== referencesInDb.length) {
    Logger.debug(`${moduleName}.validateReferences documentReferences not found`, traceId);
    failureMessages.push(...findMissingReferences(referencesInDb, outboundRefs, documentReferences));
  }

  // Validate descriptor references
  const descriptorReferenceIds: string[] = descriptorReferences.map((dr: DocumentReference) =>
    documentIdForDocumentReference(dr),
  );
  const descriptorsInDb = await findReferencedDocumentIdsById(descriptorReferenceIds, traceId, client);
  if (descriptorReferenceIds.length !== descriptorsInDb.length) {
    Logger.debug(`${moduleName}.upsertDocument: descriptorReferences not found`, traceId);
    failureMessages.push(...findMissingReferences(descriptorsInDb, descriptorReferenceIds, descriptorReferences));
  }
  return failureMessages;
}
