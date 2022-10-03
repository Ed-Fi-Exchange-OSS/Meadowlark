// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { UpdateResult, Logger, UpdateRequest } from '@edfi/meadowlark-core';
import { Collection, ClientSession, MongoClient } from 'mongodb';
import { MeadowlarkDocument, meadowlarkDocumentFrom } from '../model/MeadowlarkDocument';
import { getDocumentCollection, writeLockReferencedDocuments } from './Db';
import { validateReferences } from './ReferenceValidation';

export async function updateDocumentById(
  { id, resourceInfo, documentInfo, edfiDoc, validate, traceId, security }: UpdateRequest,
  client: MongoClient,
): Promise<UpdateResult> {
  const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
  const session: ClientSession = client.startSession();

  let updateResult: UpdateResult = { response: 'UNKNOWN_FAILURE' };

  try {
    await session.withTransaction(async () => {
      if (validate) {
        const failures = await validateReferences(
          documentInfo.documentReferences,
          documentInfo.descriptorReferences,
          mongoCollection,
          session,
          traceId,
        );

        // Abort on validation failure
        if (failures.length > 0) {
          Logger.debug(
            `mongodb.repository.Update.updateDocumentById: Updating document id ${id} failed due to invalid references`,
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

      const document: MeadowlarkDocument = meadowlarkDocumentFrom(
        resourceInfo,
        documentInfo,
        id,
        edfiDoc,
        validate,
        security.clientId,
      );

      await writeLockReferencedDocuments(mongoCollection, document.outboundRefs, session);

      // Perform the document update
      Logger.debug(`mongodb.repository.Update.updateDocumentById: Updating document id ${id}`, traceId);

      const { acknowledged, matchedCount } = await mongoCollection.replaceOne({ _id: id }, document, { session });
      if (acknowledged) {
        updateResult.response = matchedCount > 0 ? 'UPDATE_SUCCESS' : 'UPDATE_FAILURE_NOT_EXISTS';
      } else {
        const msg =
          'mongoCollection.replaceOne returned acknowledged: false, indicating a problem with write concern configuration';
        Logger.error('mongodb.repository.Update.updateDocumentById', traceId, msg);
      }
    });
  } catch (e) {
    Logger.error('mongodb.repository.Update.updateDocumentById', traceId, e);

    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return updateResult;
}
