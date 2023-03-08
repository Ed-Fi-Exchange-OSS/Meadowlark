// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-underscore-dangle */

import { Logger, Config } from '@edfi/meadowlark-utilities';
import { DeleteResult, DeleteRequest, BlockingDocument, DocumentUuid, TraceId } from '@edfi/meadowlark-core';
import { ClientSession, Collection, MongoClient, WithId } from 'mongodb';
import retry from 'async-retry';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getDocumentCollection, limitFive, onlyReturnId } from './Db';
import { onlyReturnAliasIds, onlyDocumentsReferencing } from './ReferenceValidation';

/**
 * Checks for any existing references to the document. If found, provide a DeleteResult with information on the errors.
 *
 * This function expects Session to have an active transaction. Aborting the transaction on error is left to the caller.
 */
async function checkForReferencesToDocument(
  documentUuid: DocumentUuid,
  traceId: TraceId,
  mongoCollection: Collection<MeadowlarkDocument>,
  session: ClientSession,
): Promise<DeleteResult | null> {
  // Read for aliasIds to validate against
  const deleteCandidate: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
    { documentUuid },
    onlyReturnAliasIds(session),
  );

  if (deleteCandidate == null) {
    return { response: 'DELETE_FAILURE_NOT_EXISTS' };
  }

  // Check for any references to the document to be deleted
  const anyReferences: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
    onlyDocumentsReferencing(deleteCandidate.aliasIds),
    onlyReturnId(session),
  );

  if (!anyReferences) return null;

  // Abort on validation failure
  Logger.debug(
    `mongodb.repository.Delete.checkForReferencesToDocument: Deleting document uuid ${documentUuid} failed due to existing references`,
    traceId,
  );

  // Get the information of up to five blocking documents for failure message purposes
  const referringDocuments: WithId<MeadowlarkDocument>[] = await mongoCollection
    .find(onlyDocumentsReferencing(deleteCandidate.aliasIds), limitFive(session))
    .toArray();

  const blockingDocuments: BlockingDocument[] = referringDocuments.map((document) => ({
    documentUuid: document._id,
    resourceName: document.resourceName,
    projectName: document.projectName,
    resourceVersion: document.resourceVersion,
  }));

  return { response: 'DELETE_FAILURE_REFERENCE', blockingDocuments };
}

/**
 * Takes a DeleteRequest, the MeadowlarkDocument collection, and a Session with an active transaction, and
 * performs a delete by documentUuid and returns the DeleteResult.
 *
 * This function expects Session to have an active transaction. Aborting the transaction on error is left to the caller.
 */
export async function deleteDocumentByIdTransaction(
  { documentUuid, validateNoReferencesToDocument, traceId }: DeleteRequest,
  mongoCollection: Collection<MeadowlarkDocument>,
  session: ClientSession,
): Promise<DeleteResult> {
  if (validateNoReferencesToDocument) {
    const referencesToDocumentResult: DeleteResult | null = await checkForReferencesToDocument(
      documentUuid,
      traceId,
      mongoCollection,
      session,
    );
    if (referencesToDocumentResult != null) return referencesToDocumentResult;
  }

  // Perform the document delete
  Logger.debug(
    `mongodb.repository.Delete.deleteDocumentByIdTransaction: Deleting document documentUuid ${documentUuid}`,
    traceId,
  );

  const { acknowledged, deletedCount } = await mongoCollection.deleteOne({ documentUuid }, { session });

  if (!acknowledged) {
    const msg =
      'mongoCollection.deleteOne returned acknowledged: false, indicating a problem with write concern configuration';
    Logger.error('mongodb.repository.Delete.deleteDocumentByIdTransaction', traceId, msg);
    return { response: 'UNKNOWN_FAILURE', failureMessage: '' };
  }

  if (deletedCount === 0) return { response: 'DELETE_FAILURE_NOT_EXISTS' };

  return { response: 'DELETE_SUCCESS' };
}

/**
 * Takes a DeleteRequest and MongoClient from the BackendFacade and performs a delete by documentUuid
 * and returns the DeleteResult.
 */
export async function deleteDocumentById(deleteRequest: DeleteRequest, client: MongoClient): Promise<DeleteResult> {
  const session: ClientSession = client.startSession();
  let deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE', failureMessage: '' };
  try {
    const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);

    const numberOfRetries: number = Config.get('MAX_NUMBER_OF_RETRIES') ?? 1;

    await retry(
      async () => {
        await session.withTransaction(async () => {
          deleteResult = await deleteDocumentByIdTransaction(deleteRequest, mongoCollection, session);
          if (deleteResult.response !== 'DELETE_SUCCESS') {
            await session.abortTransaction();
          }
        });
      },
      {
        retries: numberOfRetries,
        onRetry: () => {
          Logger.warn(
            `mongoCollection.deleteOne returned Write Conflict error. Document documentUuid ${deleteRequest.documentUuid}. Retrying...`,
            deleteRequest.traceId,
          );
        },
      },
    );
  } catch (e) {
    Logger.error('mongodb.repository.Delete.deleteDocumentById', deleteRequest.traceId, e);

    let response: DeleteResult = { response: 'UNKNOWN_FAILURE', failureMessage: e.message };

    if (e.codeName === 'WriteConflict') {
      response = {
        response: 'DELETE_FAILURE_WRITE_CONFLICT',
        failureMessage: 'Write conflict error returned',
      };
    }

    await session.abortTransaction();

    return response;
  } finally {
    await session.endSession();
  }
  return deleteResult;
}
