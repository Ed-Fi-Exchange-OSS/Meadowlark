// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { ClientSession, Collection, Filter, FindOptions } from 'mongodb';
import {
  getMeadowlarkIdForDocumentReference,
  DocumentReference,
  MissingIdentity,
  MeadowlarkId,
} from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { onlyReturnAliasMeadowlarkId, onlyReturnId } from './Db';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';

/**
 * Finds whether the given reference ids are actually documents in the db. Uses the aliasMeadowlarkIds
 * array for this existence check.
 *
 * @param referenceMeadowlarkIds The reference ids to check for existence in the db
 * @param mongoDocuments The MongoDb collection the documents are in
 * @param findOptions MongoDb findOptions for the query
 * @returns The subset of the given reference ids that are actually documents in the db
 */
async function findReferencedMeadowlarkIdsByMeadowlarkId(
  referenceMeadowlarkIds: MeadowlarkId[],
  mongoDocuments: Collection<MeadowlarkDocument>,
  findOptions: FindOptions,
): Promise<MeadowlarkDocument[]> {
  const referencedDocuments: MeadowlarkDocument[] = await mongoDocuments
    .find({ aliasMeadowlarkIds: { $in: referenceMeadowlarkIds } }, findOptions)
    .toArray();
  return referencedDocuments as MeadowlarkDocument[];
}

/**
 * Finds references in the document that are missing in the database
 *
 * @param refsInDb The document references that were actually found in the db (id property only)
 * @param documentOutboundRefs The document outbound references extracted from the document, as id strings
 * @param documentReferences The DocumentInfo of the document
 * @returns Failure message listing out the resource name and identity of missing document references.
 */
export function findMissingReferences(
  refsInDb: MeadowlarkDocument[],
  documentOutboundRefs: MeadowlarkId[],
  documentReferences: DocumentReference[],
): MissingIdentity[] {
  // eslint-disable-next-line no-underscore-dangle
  const meadowlarkIdsOfRefsInDb: MeadowlarkId[] = refsInDb.map((outRef) =>
    // eslint-disable-next-line no-underscore-dangle
    outRef.aliasMeadowlarkIds && outRef.aliasMeadowlarkIds.length > 0 ? outRef.aliasMeadowlarkIds[0] : outRef._id,
  );
  const outRefMeadowlarkIdsNotInDb: MeadowlarkId[] = R.difference(documentOutboundRefs, meadowlarkIdsOfRefsInDb);

  // Gets the array indexes of the missing references, for the documentOutboundRefs array
  const arrayIndexesOfMissing: number[] = outRefMeadowlarkIdsNotInDb.map((outRefMeadowlarkId) =>
    documentOutboundRefs.indexOf(outRefMeadowlarkId),
  );

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

// MongoDB FindOption to return only the aliasMeadowlarkIds field
export const onlyReturnAliasIds = (session: ClientSession): FindOptions => ({
  projection: { aliasMeadowlarkIds: 1 },
  session,
});

// MongoDB Filter on documents with the given aliasMeadowlarkIds in their outboundRefs list
export const onlyDocumentsReferencing = (aliasMeadowlarkIds: MeadowlarkId[]): Filter<MeadowlarkDocument> => ({
  outboundRefs: { $in: aliasMeadowlarkIds },
});

/**
 * Validate document and descriptor references
 *
 * @param documentReferences References for the document
 * @param descriptorReferences Descriptor references for the document
 * @param mongoDocuments The MongoDb collection the documents are in
 * @param session A MongoDb session with a transaction in progress
 * @param traceId The trace id from a service call
 * @returns A array of validation failure message, if any
 */
export async function validateReferences(
  documentReferences: DocumentReference[],
  descriptorReferences: DocumentReference[],
  mongoDocuments: Collection<MeadowlarkDocument>,
  session: ClientSession,
  traceId: string,
): Promise<MissingIdentity[]> {
  const failures: MissingIdentity[] = [];

  const referencedMeadowlarkIds: MeadowlarkId[] = documentReferences.map((dr: DocumentReference) =>
    getMeadowlarkIdForDocumentReference(dr),
  ) as MeadowlarkId[];

  const referenceMeadowlarkIdsInDb: MeadowlarkDocument[] = await findReferencedMeadowlarkIdsByMeadowlarkId(
    referencedMeadowlarkIds,
    mongoDocuments,
    onlyReturnAliasMeadowlarkId(session),
  );

  if (referencedMeadowlarkIds.length !== referenceMeadowlarkIdsInDb.length) {
    Logger.debug('mongodb.repository.WriteHelper.validateReferences: documentReferences not found', traceId);
    failures.push(...findMissingReferences(referenceMeadowlarkIdsInDb, referencedMeadowlarkIds, documentReferences));
  }

  const descriptorReferenceMeadowlarkIds: MeadowlarkId[] = descriptorReferences.map((dr: DocumentReference) =>
    getMeadowlarkIdForDocumentReference(dr),
  ) as MeadowlarkId[];

  const descriptorsInDb = await findReferencedMeadowlarkIdsByMeadowlarkId(
    descriptorReferenceMeadowlarkIds,
    mongoDocuments,
    onlyReturnId(session),
  );

  if (descriptorReferenceMeadowlarkIds.length !== descriptorsInDb.length) {
    Logger.debug('mongodb.repository.WriteHelper.validateReferences: descriptorReferences not found', traceId);
    failures.push(...findMissingReferences(descriptorsInDb, descriptorReferenceMeadowlarkIds, descriptorReferences));
  }

  return failures;
}
