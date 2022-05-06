// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

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

export async function upsertDocument(
  id: string,
  documentInfo: DocumentInfo,
  info: object,
  _validationOptions: ValidationOptions,
  _security: Security,
  lambdaRequestId: string,
): Promise<PutResult> {
  const mongoDocuments: Collection<MeadowlarkDocument> = getMongoDocuments();

  const document: MeadowlarkDocument = {
    id,
    documentIdentity: documentInfo.documentIdentity,
    projectName: documentInfo.projectName,
    resourceName: documentInfo.resourceName,
    resourceVersion: documentInfo.resourceVersion,
    edfiDoc: info,
    outRefs: documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr)),
  };

  const session: ClientSession = getClient().startSession();

  // Define Mongo options ahead of time for readability
  const ONLY_ID_IN_RESULT: FindOptions = { projection: { id: 1, _id: 0 }, session };
  const AS_UPSERT: ReplaceOptions = { upsert: true, session };

  let upsertResult: PutResult = { result: 'UNKNOWN_FAILURE' };

  try {
    await session.withTransaction(async () => {
      // Validate reference document existence
      const findDocumentsMatchingOutRefs = mongoDocuments.find({ id: { $in: document.outRefs } }, ONLY_ID_IN_RESULT);
      const existingOutRefs: MeadowlarkDocumentId[] = await findDocumentsMatchingOutRefs.toArray();

      if (document.outRefs.length !== existingOutRefs.length) {
        Logger.debug('mongodb.repository.Upsert.upsertDocument: references not found', lambdaRequestId);

        // DB read to check whether this was an update or insert attempt
        const isInsert: boolean = (await mongoDocuments.findOne({ id }, ONLY_ID_IN_RESULT)) == null;

        // TODO: provide message on which references are bad, by comparing outRefs to existingOutRefs
        upsertResult = { result: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE' };
        await session.abortTransaction();
      }

      // Perform the document upsert
      const replacementResult = await mongoDocuments.replaceOne({ id }, document, AS_UPSERT);

      if (replacementResult.upsertedCount === 0) return { result: 'UPDATE_SUCCESS' };
      return { result: 'INSERT_SUCCESS' };
    });
  } catch (e) {
    Logger.error('mongodb.repository.Upsert.upsertDocument', lambdaRequestId, e);

    return { result: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return upsertResult;
}
