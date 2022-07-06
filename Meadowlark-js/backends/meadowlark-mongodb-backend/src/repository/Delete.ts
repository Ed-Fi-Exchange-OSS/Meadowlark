// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DeleteResult, Logger, DeleteRequest } from '@edfi/meadowlark-core';
import { ClientSession, Collection, FindOptions, MongoClient, WithId } from 'mongodb';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getCollection } from './Db';
import { onlyReturnId, onlyReturnExistenceIds, onlyDocumentsReferencing } from './ReferenceValidation';

// MongoDB FindOption to return at most 5 documents
const limitFive = (session: ClientSession): FindOptions => ({ limit: 5, session });

export async function deleteDocumentById(
  { id, validate, traceId }: DeleteRequest,
  client: MongoClient,
): Promise<DeleteResult> {
  const mongoCollection: Collection<MeadowlarkDocument> = getCollection(client);
  const session: ClientSession = client.startSession();

  let deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE' };

  try {
    await session.withTransaction(async () => {
      if (validate) {
        // Read for existenceIds to validate against
        const deleteCandidate: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
          { _id: id },
          onlyReturnExistenceIds(session),
        );

        if (deleteCandidate == null) {
          deleteResult = { response: 'DELETE_FAILURE_NOT_EXISTS' };
        } else {
          // Check for any references to the document to be deleted
          const anyReferences: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
            onlyDocumentsReferencing(deleteCandidate.existenceIds),
            onlyReturnId(session),
          );

          // Abort on validation failure
          if (anyReferences) {
            Logger.debug(
              `mongodb.repository.Delete.deleteDocumentById: Deleting document id ${id} failed due to existing references`,
              traceId,
            );

            // Get the DocumentIdentities of up to five referring documents for failure message purposes
            const referringDocuments = await mongoCollection
              .find(onlyDocumentsReferencing(deleteCandidate.existenceIds), limitFive(session))
              .toArray();

            const failures: string[] = referringDocuments.map(
              (document) => `Resource ${document.resourceName} with identity '${JSON.stringify(document.documentIdentity)}'`,
            );

            deleteResult = {
              response: 'DELETE_FAILURE_REFERENCE',
              failureMessage: `Delete failed due to existing references to document: ${failures.join(',')}`,
            };

            await session.abortTransaction();
            return;
          }
        }
      }

      // Perform the document delete
      Logger.debug(`mongodb.repository.Delete.deleteDocumentById: Deleting document id ${id}`, traceId);

      const { deletedCount } = await mongoCollection.deleteOne({ _id: id }, { session });
      deleteResult.response = deletedCount === 0 ? 'DELETE_FAILURE_NOT_EXISTS' : 'DELETE_SUCCESS';
    });
  } catch (e) {
    Logger.error('mongodb.repository.Delete.deleteDocumentById', traceId, e);

    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return deleteResult;
}
