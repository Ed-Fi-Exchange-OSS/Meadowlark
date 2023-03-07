// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger, Config } from '@edfi/meadowlark-utilities';
import { DeleteResult, DeleteRequest, BlockingDocument } from '@edfi/meadowlark-core';
import { ClientSession, Collection, FindOptions, MongoClient, WithId } from 'mongodb';
import retry from 'async-retry';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getDocumentCollection, onlyReturnId } from './Db';
import { onlyReturnAliasIds, onlyDocumentsReferencing } from './ReferenceValidation';

// MongoDB FindOption to return at most 5 documents
const limitFive = (session: ClientSession): FindOptions => ({ limit: 5, session });

export async function deleteDocumentById(
  { id, validate, traceId }: DeleteRequest,
  client: MongoClient,
): Promise<DeleteResult> {
  const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
  const session: ClientSession = client.startSession();

  let deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE', failureMessage: '' };

  try {
    await session.withTransaction(async () => {
      if (validate) {
        // Read for aliasIds to validate against
        const deleteCandidate: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
          { _id: id },
          onlyReturnAliasIds(session),
        );

        if (deleteCandidate == null) {
          deleteResult = { response: 'DELETE_FAILURE_NOT_EXISTS' };
        } else {
          // Check for any references to the document to be deleted
          const anyReferences: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
            onlyDocumentsReferencing(deleteCandidate.aliasIds),
            onlyReturnId(session),
          );

          // Abort on validation failure
          if (anyReferences) {
            Logger.debug(
              `mongodb.repository.Delete.deleteDocumentById: Deleting document id ${id} failed due to existing references`,
              traceId,
            );

            // Get the information of up to five blocking documents for failure message purposes
            const referringDocuments: WithId<MeadowlarkDocument>[] = await mongoCollection
              .find(onlyDocumentsReferencing(deleteCandidate.aliasIds), limitFive(session))
              .toArray();

            const blockingDocuments: BlockingDocument[] = referringDocuments.map((document) => ({
              // eslint-disable-next-line no-underscore-dangle
              documentId: document._id,
              resourceName: document.resourceName,
              projectName: document.projectName,
              resourceVersion: document.resourceVersion,
            }));

            deleteResult = { response: 'DELETE_FAILURE_REFERENCE', blockingDocuments };

            await session.abortTransaction();
            return;
          }
        }
      }

      // Perform the document delete
      Logger.debug(`mongodb.repository.Delete.deleteDocumentById: Deleting document id ${id}`, traceId);

      const numberOfRetries: number = Config.get('MAX_NUMBER_OF_RETRIES') ?? 1;
      let mongoDeleteResult = {
        acknowledged: false,
        deletedCount: 0,
      };

      await retry(
        async () => {
          mongoDeleteResult = await mongoCollection.deleteOne({ _id: id }, { session });
        },
        {
          retries: numberOfRetries,
          onRetry: () => {
            Logger.warn(`mongoCollection.deleteOne returned error. Retrying... Deleting document id ${id}`, traceId);
          },
        },
      );
      if (mongoDeleteResult && mongoDeleteResult.acknowledged) {
        deleteResult =
          mongoDeleteResult.deletedCount === 0 ? { response: 'DELETE_FAILURE_NOT_EXISTS' } : { response: 'DELETE_SUCCESS' };
      } else {
        const msg =
          'mongoCollection.deleteOne returned acknowledged: false, indicating a problem with write concern configuration';
        Logger.error('mongodb.repository.Delete.deleteDocumentById', traceId, msg);
      }
    });
  } catch (e) {
    Logger.error('mongodb.repository.Delete.deleteDocumentById', traceId, e);

    if (e.message === '[MongoServerError: WriteConflict]') {
      return {
        response: 'DELETE_FAILURE_WRITE_CONFLICT',
        failureMessage: 'Write conflict error returned',
      };
    }

    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return deleteResult;
}
