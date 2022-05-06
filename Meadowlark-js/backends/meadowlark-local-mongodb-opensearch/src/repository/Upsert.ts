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
  PutResult,
  documentIdForDocumentReference,
  DocumentReference,
  Logger,
} from '@edfi/meadowlark-core';
import { MeadowlarkDocument, MeadowlarkDocumentId } from '../model/MeadowlarkDocument';
import { getMongoDocuments, getClient } from './Db';

/**
 * Returns an error message listing out the resource name and identity of any missing document references.
 *
 * @param refsInDb The document references that were actually found in the db (id property only)
 * @param documentOutRefs The document references extracted from the document, as id strings
 * @param documentInfo The DocumentInfo of the document
 */
function missingOutRefMessage(
  refsInDb: MeadowlarkDocumentId[],
  documentOutRefs: string[],
  documentInfo: DocumentInfo,
): string {
  const idsOfRefsInDb: string[] = refsInDb.map((outRef) => outRef.id);
  const outRefIdsNotInDb: string[] = R.difference(documentOutRefs, idsOfRefsInDb);

  // Gets the array indexes of the missing references, for the documentOutRefs array
  const arrayIndexesOfMissing: number[] = outRefIdsNotInDb.map((outRefId) => documentOutRefs.indexOf(outRefId));

  // Pick out the DocumentReferences of the missing from the entire array of DocumentReferences,
  const pickedDocumentReferencesOfMissing: DocumentReference[] = R.props(
    arrayIndexesOfMissing as any[],
    documentInfo.documentReferences as any[],
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
  lambdaRequestId: string,
): Promise<PutResult> {
  const mongoDocuments: Collection<MeadowlarkDocument> = getMongoDocuments();

  const { referenceValidation, descriptorValidation } = validationOptions;

  const document: MeadowlarkDocument = {
    id,
    documentIdentity: documentInfo.documentIdentity,
    projectName: documentInfo.projectName,
    resourceName: documentInfo.resourceName,
    resourceVersion: documentInfo.resourceVersion,
    edfiDoc: info,
    outRefs: documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr)),
    validated: referenceValidation && descriptorValidation,
    isDescriptor: documentInfo.isDescriptor,
  };

  const session: ClientSession = getClient().startSession();

  // Define Mongo options ahead of time for readability
  const ONLY_ID_IN_RESULT: FindOptions = { projection: { id: 1, _id: 0 }, session };
  const AS_UPSERT: ReplaceOptions = { upsert: true, session };

  let upsertResult: PutResult = { result: 'UNKNOWN_FAILURE' };

  try {
    await session.withTransaction(async () => {
      // Validate document references
      if (referenceValidation) {
        const findDocumentsMatchingOutRefs = mongoDocuments.find({ id: { $in: document.outRefs } }, ONLY_ID_IN_RESULT);
        const refsInDb: MeadowlarkDocumentId[] = await findDocumentsMatchingOutRefs.toArray();

        // Check for missing references
        if (document.outRefs.length !== refsInDb.length) {
          Logger.debug('mongodb.repository.Upsert.upsertDocument: references not found', lambdaRequestId);

          // DB read to check whether this was an update or insert attempt
          const isInsert: boolean = (await mongoDocuments.findOne({ id }, ONLY_ID_IN_RESULT)) == null;

          upsertResult = {
            result: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE',
            failureMessage: `Reference validation failed: ${missingOutRefMessage(refsInDb, document.outRefs, documentInfo)}`,
          };

          await session.abortTransaction();
          return;
        }
      }

      // Validate descriptor references
      if (descriptorValidation) {
        return;
      }

      // Perform the document upsert
      Logger.debug(`mongodb.repository.Upsert.upsertDocument: Upserting document id ${id}`, lambdaRequestId);

      const { upsertedCount } = await mongoDocuments.replaceOne({ id }, document, AS_UPSERT);
      upsertResult.result = upsertedCount === 0 ? 'UPDATE_SUCCESS' : 'INSERT_SUCCESS';
    });
  } catch (e) {
    Logger.error('mongodb.repository.Upsert.upsertDocument', lambdaRequestId, e);

    return { result: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return upsertResult;
}
