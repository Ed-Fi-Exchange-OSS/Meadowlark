// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo, Security, UpdateResult, Logger } from '@edfi/meadowlark-core';
import { Collection, ClientSession } from 'mongodb';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getMongoCollection, getClient } from './Db';
import { newMeadowlarkDocument, validateReferences } from './WriteHelper';

export async function updateDocumentById(
  id: string,
  documentInfo: DocumentInfo,
  edfiDoc: object,
  validate: boolean,
  _security: Security,
  traceId: string,
): Promise<UpdateResult> {
  const document: MeadowlarkDocument = newMeadowlarkDocument(documentInfo, id, edfiDoc, validate);

  const mongoCollection: Collection<MeadowlarkDocument> = getMongoCollection();
  const session: ClientSession = getClient().startSession();

  let updateResult: UpdateResult = { result: 'UNKNOWN_FAILURE' };

  try {
    await session.withTransaction(async () => {
      if (validate) {
        const failures = await validateReferences(
          documentInfo.documentReferences,
          documentInfo.descriptorReferences,
          document.outRefs,
          mongoCollection,
          session,
          traceId,
        );

        // Abort on validation failure
        if (failures.length > 0) {
          Logger.debug(
            `mongodb.repository.Upsert.updateDocumentById: Updating document id ${id} failed due to invalid references`,
            traceId,
          );

          updateResult = {
            result: 'UPDATE_FAILURE_REFERENCE',
            failureMessage: `Reference validation failed: ${failures.join(',')}`,
          };

          await session.abortTransaction();
          return;
        }
      }

      // Perform the document update
      Logger.debug(`mongodb.repository.Upsert.updateDocumentById: Updating document id ${id}`, traceId);

      const { matchedCount } = await mongoCollection.replaceOne({ id }, document, { session });
      updateResult.result = matchedCount > 0 ? 'UPDATE_SUCCESS' : 'UPDATE_FAILURE_NOT_EXISTS';
    });
  } catch (e) {
    Logger.error('mongodb.repository.Upsert.updateDocumentById', traceId, e);

    return { result: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return updateResult;
}
