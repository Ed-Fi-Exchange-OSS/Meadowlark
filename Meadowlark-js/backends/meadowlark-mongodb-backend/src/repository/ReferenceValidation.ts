// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { ClientSession, Collection, Filter, FindOptions, WithId } from 'mongodb';
import { documentIdForDocumentReference, DocumentReference, MissingIdentity } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { MeadowlarkDocument, MeadowlarkDocumentId } from '../model/MeadowlarkDocument';
import { onlyReturnId } from './Db';

/**
 * Finds whether the given reference ids are actually documents in the db. Uses the aliasIds
 * array for this existence check.
 *
 * @param referenceIds The reference ids to check for existence in the db
 * @param mongoDocuments The MongoDb collection the documents are in
 * @param findOptions MongoDb findOptions for the query
 * @returns The subset of the given reference ids that are actually documents in the db
 */
async function findReferencedDocumentIdsById(
  referenceIds: string[],
  mongoDocuments: Collection<MeadowlarkDocument>,
  findOptions: FindOptions,
): Promise<MeadowlarkDocumentId[]> {
  const referencedDocuments: WithId<MeadowlarkDocument>[] = await mongoDocuments
    .find({ aliasIds: { $in: referenceIds } }, findOptions)
    .toArray();
  return referencedDocuments as MeadowlarkDocumentId[];
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
  refsInDb: MeadowlarkDocumentId[],
  documentOutboundRefs: string[],
  documentReferences: DocumentReference[],
): MissingIdentity[] {
  // eslint-disable-next-line no-underscore-dangle
  const idsOfRefsInDb: string[] = refsInDb.map((outRef) => outRef._id);
  const outRefIdsNotInDb: string[] = R.difference(documentOutboundRefs, idsOfRefsInDb);

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

// MongoDB FindOption to return only the aliasIds field
export const onlyReturnAliasIds = (session: ClientSession): FindOptions => ({
  projection: { aliasIds: 1 },
  session,
});

// MongoDB Filter on documents with the given aliasIds in their outboundRefs list
export const onlyDocumentsReferencing = (aliasIds: string[]): Filter<MeadowlarkDocument> => ({
  outboundRefs: { $in: aliasIds },
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

  const referencedMeadowlarkIds: string[] = documentReferences.map((dr: DocumentReference) =>
    documentIdForDocumentReference(dr),
  );

  const referenceIdsInDb: MeadowlarkDocumentId[] = await findReferencedDocumentIdsById(
    referencedMeadowlarkIds,
    mongoDocuments,
    onlyReturnId(session),
  );

  if (referencedMeadowlarkIds.length !== referenceIdsInDb.length) {
    Logger.debug('mongodb.repository.WriteHelper.validateReferences: documentReferences not found', traceId);
    failures.push(...findMissingReferences(referenceIdsInDb, referencedMeadowlarkIds, documentReferences));
  }

  const descriptorReferenceIds: string[] = descriptorReferences.map((dr: DocumentReference) =>
    documentIdForDocumentReference(dr),
  );

  const descriptorsInDb = await findReferencedDocumentIdsById(descriptorReferenceIds, mongoDocuments, onlyReturnId(session));

  if (descriptorReferenceIds.length !== descriptorsInDb.length) {
    Logger.debug('mongodb.repository.WriteHelper.validateReferences: descriptorReferences not found', traceId);
    failures.push(...findMissingReferences(descriptorsInDb, descriptorReferenceIds, descriptorReferences));
  }

  return failures;
}
