// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { ClientSession, Collection, FindOptions, ReplaceOptions } from 'mongodb';
import {
  documentIdForDocumentReference,
  DocumentInfo,
  DocumentReference,
  Logger,
  ResourceInfo,
} from '@edfi/meadowlark-core';
import { MeadowlarkDocument, MeadowlarkDocumentId } from '../model/MeadowlarkDocument';

export async function findReferencesById(
  referenceIds: string[],
  mongoDocuments: Collection<MeadowlarkDocument>,
  findOptions: FindOptions,
): Promise<MeadowlarkDocumentId[]> {
  const findReferenceDocuments = mongoDocuments.find({ id: { $in: referenceIds } }, findOptions);
  return (await findReferenceDocuments.toArray()) as unknown as MeadowlarkDocumentId[];
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

// MongoDB FindOption to return only the indexed id field, making this a covered query (MongoDB will optimize)
export const onlyReturnId = (session: ClientSession): FindOptions => ({ projection: { id: 1, _id: 0 }, session });

// MongoDB ReplaceOption that enables upsert (insert if not exists)
export const asUpsert = (session: ClientSession): ReplaceOptions => ({ upsert: true, session });

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
  documentCollection: Collection<MeadowlarkDocument>,
  session: ClientSession,
  traceId: string,
): Promise<string[]> {
  const failureMessages: string[] = [];

  const referencesInDb = await findReferencesById(outRefs, documentCollection, onlyReturnId(session));
  if (outRefs.length !== referencesInDb.length) {
    Logger.debug('mongodb.repository.Upsert.upsertDocument: documentReferences not found', traceId);
    failureMessages.push(...findMissingReferences(referencesInDb, outRefs, documentReferences));
  }

  // Validate descriptor references
  const descriptorReferenceIds: string[] = descriptorReferences.map((dr: DocumentReference) =>
    documentIdForDocumentReference(dr),
  );
  const descriptorsInDb = await findReferencesById(descriptorReferenceIds, documentCollection, onlyReturnId(session));
  if (descriptorReferenceIds.length !== descriptorsInDb.length) {
    Logger.debug('mongodb.repository.Upsert.upsertDocument: descriptorReferences not found', traceId);
    failureMessages.push(...findMissingReferences(descriptorsInDb, descriptorReferenceIds, descriptorReferences));
  }

  return failureMessages;
}

export function meadowlarkDocumentFrom(
  resourceInfo: ResourceInfo,
  documentInfo: DocumentInfo,
  id: string,
  edfiDoc: object,
  validate: boolean,
  createdBy: string,
): MeadowlarkDocument {
  return {
    documentIdentity: documentInfo.documentIdentity,
    projectName: resourceInfo.projectName,
    resourceName: resourceInfo.resourceName,
    resourceVersion: resourceInfo.resourceVersion,
    isDescriptor: resourceInfo.isDescriptor,
    id,
    edfiDoc,
    outRefs: documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr)),
    validated: validate,
    createdBy,
  };
}
