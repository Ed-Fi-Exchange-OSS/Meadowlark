// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { Collection, ClientSession, FindOptions, ReplaceOptions } from 'mongodb';
import {
  DocumentInfo,
  Security,
  ValidationOptions,
  UpsertResult,
  documentIdForDocumentReference,
  DocumentReference,
  Logger,
} from '@edfi/meadowlark-core';
import { MeadowlarkDocument, MeadowlarkDocumentId } from '../model/MeadowlarkDocument';
import { getDocumentCollection, getClient } from './Db';

async function findReferencesById(
  referenceIds: string[],
  mongoDocuments: Collection<MeadowlarkDocument>,
  findOptions: FindOptions,
): Promise<MeadowlarkDocumentId[]> {
  const findReferenceDocuments = mongoDocuments.find({ id: { $in: referenceIds } }, findOptions);
  return (await findReferenceDocuments.toArray()) as unknown as MeadowlarkDocumentId[];
}

/**
 * Returns an error message listing out the resource name and identity of any missing document references.
 *
 * @param refsInDb The document references that were actually found in the db (id property only)
 * @param documentOutRefs The document references extracted from the document, as id strings
 * @param documentInfo The DocumentInfo of the document
 */
function missingReferencesMessage(
  refsInDb: MeadowlarkDocumentId[],
  documentOutRefs: string[],
  documentReferences: DocumentReference[],
): string {
  const idsOfRefsInDb: string[] = refsInDb.map((outRef) => outRef.id);
  const outRefIdsNotInDb: string[] = R.difference(documentOutRefs, idsOfRefsInDb);

  // Gets the array indexes of the missing references, for the documentOutRefs array
  const arrayIndexesOfMissing: number[] = outRefIdsNotInDb.map((outRefId) => documentOutRefs.indexOf(outRefId));

  // Pick out the DocumentReferences of the missing from the entire array of DocumentReferences,
  const pickedDocumentReferencesOfMissing: DocumentReference[] = R.props(
    arrayIndexesOfMissing as any[],
    documentReferences as any[],
  );

  return pickedDocumentReferencesOfMissing
    .map((dr) => `Resource ${dr.resourceName} is missing identity ${JSON.stringify(dr.documentIdentity)}`)
    .join(',');
}

export async function upsertDocument(
  id: string,
  documentInfo: DocumentInfo,
  info: object,
  validationOptions: ValidationOptions,
  _security: Security,
  traceId: string,
): Promise<UpsertResult> {
  const documentCollection: Collection<MeadowlarkDocument> = getDocumentCollection();

  const { referenceValidation } = validationOptions;

  const document: MeadowlarkDocument = {
    id,
    documentIdentity: documentInfo.documentIdentity,
    projectName: documentInfo.projectName,
    resourceName: documentInfo.resourceName,
    resourceVersion: documentInfo.resourceVersion,
    edfiDoc: info,
    outRefs: documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr)),
    validated: referenceValidation,
    isDescriptor: documentInfo.isDescriptor,
  };

  const session: ClientSession = getClient().startSession();

  // Define Mongo options ahead of time for readability
  const ONLY_ID_IN_RESULT: FindOptions = { projection: { id: 1, _id: 0 }, session };
  const AS_UPSERT: ReplaceOptions = { upsert: true, session };

  let upsertResult: UpsertResult = { result: 'UNKNOWN_FAILURE' };

  try {
    await session.withTransaction(async () => {
      if (referenceValidation) {
        const failureMessages: string[] = [];

        // Validate document references
        const referencesInDb = await findReferencesById(document.outRefs, documentCollection, ONLY_ID_IN_RESULT);
        if (document.outRefs.length !== referencesInDb.length) {
          Logger.debug('mongodb.repository.Upsert.upsertDocument: documentReferences not found', traceId);
          failureMessages.push(missingReferencesMessage(referencesInDb, document.outRefs, documentInfo.documentReferences));
        }

        // Validate descriptor references
        const descriptorReferenceIds: string[] = documentInfo.descriptorReferences.map((dr: DocumentReference) =>
          documentIdForDocumentReference(dr),
        );
        const descriptorsInDb = await findReferencesById(descriptorReferenceIds, documentCollection, ONLY_ID_IN_RESULT);
        if (descriptorReferenceIds.length !== descriptorsInDb.length) {
          Logger.debug('mongodb.repository.Upsert.upsertDocument: descriptorReferences not found', traceId);
          failureMessages.push(
            missingReferencesMessage(descriptorsInDb, descriptorReferenceIds, documentInfo.descriptorReferences),
          );
        }

        // Abort on validation failure
        if (failureMessages.length > 0) {
          // DB read to check whether this would have been an insert or update
          const isInsert: boolean = (await documentCollection.findOne({ id }, ONLY_ID_IN_RESULT)) == null;

          upsertResult = {
            result: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE',
            failureMessage: `Reference validation failed: ${failureMessages.join(',')}`,
          };

          await session.abortTransaction();
          return;
        }
      }

      // Perform the document upsert
      Logger.debug(`mongodb.repository.Upsert.upsertDocument: Upserting document id ${id}`, traceId);

      const { upsertedCount } = await documentCollection.replaceOne({ id }, document, AS_UPSERT);
      upsertResult.result = upsertedCount === 0 ? 'UPDATE_SUCCESS' : 'INSERT_SUCCESS';
    });
  } catch (e) {
    Logger.error('mongodb.repository.Upsert.upsertDocument', traceId, e);

    return { result: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return upsertResult;
}
