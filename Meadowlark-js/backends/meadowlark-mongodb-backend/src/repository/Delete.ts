// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import { DeleteResult, DeleteRequest, BlockingDocument } from '@edfi/meadowlark-core';
import { ClientSession, Collection, FindOptions, MongoClient, WithId } from 'mongodb';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getDocumentCollection, onlyReturnId } from './Db';
import { onlyReturnAliasIds, onlyDocumentsReferencing } from './ReferenceValidation';

// MongoDB FindOption to return at most 5 documents
const limitFive = (session: ClientSession): FindOptions => ({ limit: 5, session });

export async function deleteDocumentByIdTransaction(
  { documentUuid, validate, traceId }: DeleteRequest,
  client: MongoClient,
  session: ClientSession,
): Promise<DeleteResult> {
  const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
  let deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE', failureMessage: '' };
  if (validate) {
    // Read for aliasIds to validate against
    const deleteCandidate: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
      { documentUuid },
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
          `mongodb.repository.Delete.deleteDocumentById: Deleting document uuid ${documentUuid} failed due to existing references`,
          traceId,
        );

        // Get the information of up to five blocking documents for failure message purposes
        const referringDocuments: WithId<MeadowlarkDocument>[] = await mongoCollection
          .find(onlyDocumentsReferencing(deleteCandidate.aliasIds), limitFive(session))
          .toArray();

        const blockingDocuments: BlockingDocument[] = referringDocuments.map((document) => ({
          // eslint-disable-next-line no-underscore-dangle
          documentUuid: document._id,
          resourceName: document.resourceName,
          projectName: document.projectName,
          resourceVersion: document.resourceVersion,
        }));

        deleteResult = { response: 'DELETE_FAILURE_REFERENCE', blockingDocuments };

        await session.abortTransaction();
        return deleteResult;
      }
    }
  }

  // Perform the document delete
  Logger.debug(`mongodb.repository.Delete.deleteDocumentById: Deleting document documentUuid ${documentUuid}`, traceId);

  const { acknowledged, deletedCount } = await mongoCollection.deleteOne({ documentUuid }, { session });
  if (acknowledged) {
    deleteResult = deletedCount === 0 ? { response: 'DELETE_FAILURE_NOT_EXISTS' } : { response: 'DELETE_SUCCESS' };
  } else {
    const msg =
      'mongoCollection.deleteOne returned acknowledged: false, indicating a problem with write concern configuration';
    Logger.error('mongodb.repository.Delete.deleteDocumentById', traceId, msg);
  }
  return deleteResult;
}

export async function deleteDocumentById(
  { documentUuid, validate, traceId }: DeleteRequest,
  client: MongoClient,
): Promise<DeleteResult> {
  const session: ClientSession = client.startSession();
  let deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE', failureMessage: '' };
  try {
    await session.withTransaction(async () => {
      deleteResult = await deleteDocumentByIdTransaction(
        { documentUuid, validate, traceId } as DeleteRequest,
        client,
        session,
      );
    });
  } catch (e) {
    Logger.error('mongodb.repository.Delete.deleteDocumentById', traceId, e);

    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }
  return deleteResult;
}
