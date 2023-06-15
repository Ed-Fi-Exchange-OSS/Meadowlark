// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import {
  MeadowlarkId,
  MissingIdentity,
  getMeadowlarkIdForDocumentReference,
  DocumentReference,
} from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { PoolClient } from 'pg';
import { validateReferenceExistence } from './SqlHelper';

const moduleName = 'postgresql.repository.ReferenceValidation';

/**
 * Finds whether the given reference meadowlarkIds are actually documents in the db.
 *
 * @param referenceIds The reference meadowlarkIds to check for existence in the db
 * @param client The PostgreSQL client used for querying the database
 * @returns The subset of the given reference meadowlarkIds that are actually documents in the db
 */
async function findReferencedMeadowlarkIdsByMeadowlarkId(
  referenceMeadowlarkIds: MeadowlarkId[],
  traceId: string,
  client: PoolClient,
): Promise<MeadowlarkId[]> {
  Logger.info(`${moduleName}.findReferencedMeadowlarkIdsByMeadowlarkId`, traceId);

  if (referenceMeadowlarkIds.length === 0) {
    return [];
  }

  const referenceExistenceResult = await validateReferenceExistence(client, referenceMeadowlarkIds as MeadowlarkId[]);

  if (referenceExistenceResult == null) {
    Logger.error(`${moduleName}.findReferencedMeadowlarkIdsByMeadowlarkId Database error parsing references`, traceId);
    throw new Error(`${moduleName}.findReferencedMeadowlarkIdsByMeadowlarkId Database error parsing references`);
  }

  return referenceExistenceResult.map((val) => val);
}

/**
 * Finds references in the document that are missing in the database
 *
 * @param refsInDb The document references that were actually found in the db (meadowlarkId property only)
 * @param documentOutboundRefs The document references extracted from the document, as meadowlarkId strings
 * @param documentReferences The DocumentReferences of the document
 * @returns Failure message listing out the resource name and identity of missing document references, if any.
 */
export function findMissingReferences(
  refsInDb: MeadowlarkId[],
  documentOutboundRefs: MeadowlarkId[],
  documentReferences: DocumentReference[],
): MissingIdentity[] {
  const outRefIdsNotInDb: MeadowlarkId[] = R.difference(documentOutboundRefs, refsInDb);

  // Gets the array indexes of the missing references, for the documentOutboundRefs array
  const arrayIndexesOfMissing: number[] = outRefIdsNotInDb.map((outRefId) => documentOutboundRefs.indexOf(outRefId));

  // Pick out the DocumentReferences of the missing from the entire array of DocumentReferences,
  const pickedDocumentReferencesOfMissing: DocumentReference[] = R.props(
    arrayIndexesOfMissing as any[],
    documentReferences as any[],
  );

  return pickedDocumentReferencesOfMissing.map((reference) => ({
    resourceName: reference.resourceName,
    identity: reference.documentIdentity,
  }));
}

/**
 * Validate document and descriptor references
 *
 * @param documentReferences References for the document
 * @param descriptorReferences Descriptor references for the document
 * @param outboundRefs The list of meadowlarkIds for the document references
 * @param client The PostgreSQL client used for querying the database
 * @param traceId The trace id from a service call
 * @returns A array of validation failure message, if any
 */
export async function validateReferences(
  documentReferences: DocumentReference[],
  descriptorReferences: DocumentReference[],
  outboundRefs: MeadowlarkId[],
  client: PoolClient,
  traceId: string,
): Promise<MissingIdentity[]> {
  const failureMessages: MissingIdentity[] = [];

  const referencesInDb = await findReferencedMeadowlarkIdsByMeadowlarkId(outboundRefs, traceId, client);
  if (outboundRefs.length !== referencesInDb.length) {
    Logger.debug(`${moduleName}.validateReferences documentReferences not found`, traceId);
    failureMessages.push(...findMissingReferences(referencesInDb, outboundRefs, documentReferences));
  }

  // Validate descriptor references
  const descriptorReferenceMeadowlarkIds: MeadowlarkId[] = descriptorReferences.map((dr: DocumentReference) =>
    getMeadowlarkIdForDocumentReference(dr),
  );
  const descriptorsInDb = await findReferencedMeadowlarkIdsByMeadowlarkId(descriptorReferenceMeadowlarkIds, traceId, client);
  if (descriptorReferenceMeadowlarkIds.length !== descriptorsInDb.length) {
    Logger.debug(`${moduleName}.upsertDocument: descriptorReferences not found`, traceId);
    failureMessages.push(...findMissingReferences(descriptorsInDb, descriptorReferenceMeadowlarkIds, descriptorReferences));
  }
  return failureMessages;
}
