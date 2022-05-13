// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { UpdateResult, Logger, UpdateRequest } from '@edfi/meadowlark-core';
import { Collection, ClientSession, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getCollection } from './Db';
import { meadowlarkDocumentFrom, validateReferences } from './WriteHelper';

export async function updateDocumentById(
  { id, documentInfo, edfiDoc, validate, traceId, security }: UpdateRequest,
  client: MongoClient,
): Promise<UpdateResult> {
  const document: MeadowlarkDocument = meadowlarkDocumentFrom(documentInfo, id, edfiDoc, validate, security.clientName);

  const mongoCollection: Collection<MeadowlarkDocument> = getCollection(client);
  const session: ClientSession = client.startSession();

  let updateResult: UpdateResult = { response: 'UNKNOWN_FAILURE' };

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
            response: 'UPDATE_FAILURE_REFERENCE',
            failureMessage: `Reference validation failed: ${failures.join(',')}`,
          };

          await session.abortTransaction();
          return;
        }
      }

      // Perform the document update
      Logger.debug(`mongodb.repository.Upsert.updateDocumentById: Updating document id ${id}`, traceId);

      const { matchedCount } = await mongoCollection.replaceOne({ id }, document, { session });
      updateResult.response = matchedCount > 0 ? 'UPDATE_SUCCESS' : 'UPDATE_FAILURE_NOT_EXISTS';
    });
  } catch (e) {
    Logger.error('mongodb.repository.Upsert.updateDocumentById', traceId, e);

    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return updateResult;
}
