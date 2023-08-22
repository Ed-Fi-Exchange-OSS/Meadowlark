// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-underscore-dangle */

import { UpdateResult, UpdateRequest, ReferringDocumentInfo } from '@edfi/meadowlark-core';
import { Logger, Config } from '@edfi/meadowlark-utilities';
import { Collection, ClientSession, MongoClient, WithId } from 'mongodb';
import retry from 'async-retry';
import { MeadowlarkDocument, meadowlarkDocumentFrom } from '../model/MeadowlarkDocument';
import { getDocumentCollection, limitFive, onlyReturnTimestamps, writeLockReferencedDocuments } from './Db';
import { deleteDocumentByMeadowlarkIdTransaction } from './Delete';
import { onlyDocumentsReferencing, validateReferences } from './ReferenceValidation';
import { upsertDocumentTransaction } from './Upsert';

const moduleName: string = 'mongodb.repository.Update';

/**
 * Attempts to insert the updated document. Intended to be used after a delete where the identity can change.
 * Assumes document reference validation has already taken place.
 *
 * This function expects Session to have an active transaction. Aborting the transaction on error is left to the caller.
 */
async function insertUpdatedDocument(
  { meadowlarkId, resourceInfo, documentInfo, edfiDoc, traceId, security }: UpdateRequest,
  mongoCollection: Collection<MeadowlarkDocument>,
  session: ClientSession,
  document: MeadowlarkDocument,
): Promise<UpdateResult> {
  const upsertResult = await upsertDocumentTransaction(
    {
      resourceInfo,
      documentInfo,
      meadowlarkId,
      edfiDoc,
      validateDocumentReferencesExist: false,
      traceId,
      security,
    },
    mongoCollection,
    session,
    document,
  );

  switch (upsertResult.response) {
    case 'INSERT_SUCCESS':
      return { response: 'UPDATE_SUCCESS' };
    case 'UPDATE_SUCCESS':
      // Something unexpected happened. There should have been a prior delete, making this impossible.
      Logger.error(
        `${moduleName}.insertUpdatedDocument`,
        traceId,
        'Got "UPDATE_SUCCESS" from upsertDocumentTransaction() but document should have been deleted first',
      );
      return { response: 'UPDATE_SUCCESS' };
    case 'INSERT_FAILURE_REFERENCE':
      // Something unexpected happened. Validation should not have occurred.
      Logger.error(
        `${moduleName}.insertUpdatedDocument`,
        traceId,
        'Got "INSERT_FAILURE_REFERENCE" from upsertDocumentTransaction() but references should not have been validated',
      );
      return { response: 'UPDATE_FAILURE_REFERENCE', referringDocumentInfo: upsertResult.referringDocumentInfo };
    case 'UPDATE_FAILURE_REFERENCE':
      // Something unexpected happened. There should have been a prior delete, and validation should not have occurred.
      Logger.error(
        `${moduleName}.insertUpdatedDocument`,
        traceId,
        'Got "UPDATE_FAILURE_REFERENCE" from upsertDocumentTransaction() but document should have been deleted first and references should not have been validated',
      );
      return { response: 'UPDATE_FAILURE_REFERENCE', referringDocumentInfo: upsertResult.referringDocumentInfo };
    case 'INSERT_FAILURE_CONFLICT':
      return { response: 'UPDATE_FAILURE_CONFLICT', referringDocumentInfo: upsertResult.referringDocumentInfo };
    default:
      return { response: 'UNKNOWN_FAILURE', failureMessage: upsertResult.failureMessage };
  }
}

/**
 * Attempt to update the document via replacement. Succeeds if a document with the given uuid and identity
 * (meadowlarkId) exists. Returns null if either document is not there (invalid documentUuid) or this is an
 * attempt to change the document identity (mismatched meadowlarkId).
 *
 * This function expects Session to have an active transaction. Aborting the transaction on error is left to the caller.
 */
async function tryUpdateByReplacement(
  document: MeadowlarkDocument,
  { meadowlarkId, documentUuid, traceId }: UpdateRequest,
  mongoCollection: Collection<MeadowlarkDocument>,
  session: ClientSession,
): Promise<UpdateResult | null> {
  // Try to update - for a matching documentUuid and matching identity (via meadowlarkId),
  // where the update request is not stale
  const { acknowledged, matchedCount } = await mongoCollection.updateOne(
    {
      _id: meadowlarkId,
      documentUuid,
      lastModifiedAt: { $lt: document.lastModifiedAt },
    },
    {
      $set: {
        documentIdentity: document.documentIdentity,
        projectName: document.projectName,
        resourceName: document.resourceName,
        resourceVersion: document.resourceVersion,
        isDescriptor: document.isDescriptor,
        edfiDoc: document.edfiDoc,
        aliasMeadowlarkIds: document.aliasMeadowlarkIds,
        outboundRefs: document.outboundRefs,
        validated: document.validated,
        lastModifiedAt: document.lastModifiedAt,
      },
    },
    {
      session,
    },
  );

  // Check for general MongoDB problems
  if (!acknowledged) {
    const msg =
      'mongoCollection.replaceOne returned acknowledged: false, indicating a problem with write concern configuration';
    Logger.error(`${moduleName}.tryUpdateByReplacement`, traceId, msg);
    return { response: 'UNKNOWN_FAILURE' };
  }

  // If there was a match on replace, success
  if (matchedCount > 0) return { response: 'UPDATE_SUCCESS' };

  return null;
}

/**
 * Attempts to update the document, by replacement if there is no identity (meadowlarkId) change, or by
 * by deleting and reinserting if there is an identity change. Delete + reinsert allows for identity change because
 * identity (meadowlarkId) is the MongoDB _id.
 *
 * This function expects Session to have an active transaction. Aborting the transaction on error is left to the caller.
 */
async function updateAllowingIdentityChange(
  document: MeadowlarkDocument,
  updateRequest: UpdateRequest,
  mongoCollection: Collection<MeadowlarkDocument>,
  session: ClientSession,
): Promise<UpdateResult> {
  const { documentUuid, resourceInfo, traceId, security } = updateRequest;

  // Optimize happy path by trying a replacement update, which will succeed if there is no identity change
  const tryUpdateByReplacementResult: UpdateResult | null = await tryUpdateByReplacement(
    document,
    updateRequest,
    mongoCollection,
    session,
  );

  if (tryUpdateByReplacementResult != null) {
    // Ensure referenced documents are not modified in other transactions
    await writeLockReferencedDocuments(mongoCollection, document.outboundRefs, session);
    return tryUpdateByReplacementResult;
  }

  // Failure to match means either:
  //  1) document not there (invalid documentUuid)
  //  2) this is an attempt to change the document identity (mismatched meadowlarkId)
  //  3) the requestTimestamp for the update is too old

  // See if the document is there
  const documentByUuid: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
    { documentUuid: updateRequest.documentUuid },
    onlyReturnTimestamps(session),
  );

  if (documentByUuid == null) {
    // The document is not there
    return { response: 'UPDATE_FAILURE_NOT_EXISTS' };
  }

  if (documentByUuid.lastModifiedAt >= document.lastModifiedAt) {
    // The update request is stale
    return { response: 'UPDATE_FAILURE_WRITE_CONFLICT' };
  }

  // Get the createdAt from the original document before deleting
  document.createdAt = documentByUuid.createdAt;

  // Attempt to delete document before insert. Will work only if meadowlarkIds match between old and new
  const deleteResult = await deleteDocumentByMeadowlarkIdTransaction(
    { documentUuid, resourceInfo, security, validateNoReferencesToDocument: true, traceId },
    mongoCollection,
    session,
  );
  Logger.debug(`${moduleName}.updateAllowingIdentityChange: Updating document uuid ${documentUuid}`, traceId);

  switch (deleteResult.response) {
    case 'DELETE_SUCCESS':
      // document was deleted, so we can insert the new version
      return insertUpdatedDocument(updateRequest, mongoCollection, session, document);
    case 'DELETE_FAILURE_NOT_EXISTS':
      // document was not found on delete, which shouldn't happen
      return {
        response: 'UNKNOWN_FAILURE',
        failureMessage: `Document uuid ${documentUuid} should have been found but was not`,
      };
    case 'DELETE_FAILURE_REFERENCE':
      // We have an update cascade scenario
      //
      // TODO: Collect all the blocking documents that need updating (not just the first 5!)
      //       Delete again without validating references
      //       Do the insert
      //       If everything succeeds, schedule the cascade - updating each referring document
      // For now, let it be known this is an update cascade scenario, but do nothing
      return { response: 'UPDATE_CASCADE_REQUIRED' };
    default:
      return { response: 'UNKNOWN_FAILURE', failureMessage: deleteResult.failureMessage };
  }
}

/**
 * Update the document, disallowing an identity change. Succeeds if a document with the given uuid and
 * identity (meadowlarkId) exists.
 *
 * This function expects Session to have an active transaction. Aborting the transaction on error is left to the caller.
 */
async function updateDisallowingIdentityChange(
  document: MeadowlarkDocument,
  updateRequest: UpdateRequest,
  mongoCollection: Collection<MeadowlarkDocument>,
  session: ClientSession,
): Promise<UpdateResult> {
  // Perform the document update
  Logger.debug(
    `${moduleName}.updateDisallowingIdentityChange: Updating DocumentUuid ${updateRequest.documentUuid}`,
    updateRequest.traceId,
  );

  // Ensure referenced documents are not modified in other transactions
  await writeLockReferencedDocuments(mongoCollection, document.outboundRefs, session);

  const tryUpdateByReplacementResult: UpdateResult | null = await tryUpdateByReplacement(
    document,
    updateRequest,
    mongoCollection,
    session,
  );

  if (tryUpdateByReplacementResult != null) return tryUpdateByReplacementResult;

  // Failure to match means either:
  //  1) document not there (invalid documentUuid)
  //  2) this is an attempt to change the document identity (mismatched meadowlarkId)
  //  3) the requestTimestamp for the update is too old

  // See if the document is there
  const documentByUuid: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
    { documentUuid: updateRequest.documentUuid },
    onlyReturnTimestamps(session),
  );

  if (documentByUuid == null) {
    // The document is not there
    return { response: 'UPDATE_FAILURE_NOT_EXISTS' };
  }

  if (documentByUuid.lastModifiedAt >= document.lastModifiedAt) {
    // The update request is stale
    return { response: 'UPDATE_FAILURE_WRITE_CONFLICT' };
  }

  // The identity of the new document is different from the existing document
  return { response: 'UPDATE_FAILURE_IMMUTABLE_IDENTITY' };
}

/**
 * Checks for any invalid references in document. If found, provide an UpdateResult with information on the errors.
 *
 * This function expects Session to have an active transaction. Aborting the transaction on error is left to the caller.
 */
async function checkForInvalidReferences(
  { documentInfo, documentUuid, traceId, meadowlarkId }: UpdateRequest,
  mongoCollection: Collection<MeadowlarkDocument>,
  session: ClientSession,
): Promise<UpdateResult | null> {
  const failures = await validateReferences(
    documentInfo.documentReferences,
    documentInfo.descriptorReferences,
    mongoCollection,
    session,
    traceId,
  );

  if (failures.length === 0) return null;

  Logger.debug(
    `${moduleName}.checkForInvalidReferences: Updating DocumentUuid ${documentUuid} failed due to invalid references`,
    traceId,
  );

  const referringDocuments: WithId<MeadowlarkDocument>[] = await mongoCollection
    .find(onlyDocumentsReferencing([meadowlarkId]), limitFive(session))
    .toArray();

  const referringDocumentInfo: ReferringDocumentInfo[] = referringDocuments.map((document) => ({
    documentUuid: document.documentUuid,
    meadowlarkId: document._id,
    resourceName: document.resourceName,
    projectName: document.projectName,
    resourceVersion: document.resourceVersion,
  }));

  return {
    response: 'UPDATE_FAILURE_REFERENCE',
    failureMessage: { message: 'Reference validation failed', failures },
    referringDocumentInfo,
  };
}

async function updateDocumentByDocumentUuidTransaction(
  updateRequest: UpdateRequest,
  mongoCollection: Collection<MeadowlarkDocument>,
  session: ClientSession,
): Promise<UpdateResult> {
  const { meadowlarkId, documentUuid, resourceInfo, documentInfo, edfiDoc, validateDocumentReferencesExist, security } =
    updateRequest;
  if (validateDocumentReferencesExist) {
    const invalidReferenceResult: UpdateResult | null = await checkForInvalidReferences(
      updateRequest,
      mongoCollection,
      session,
    );
    if (invalidReferenceResult !== null) {
      return invalidReferenceResult;
    }
  }
  const document: MeadowlarkDocument = meadowlarkDocumentFrom({
    resourceInfo,
    documentInfo,
    documentUuid,
    meadowlarkId,
    edfiDoc,
    validate: validateDocumentReferencesExist,
    createdBy: security.clientId,
    createdAt: null, // null because this is a document update, createdAt must come from existing document
    lastModifiedAt: documentInfo.requestTimestamp,
  });
  if (resourceInfo.allowIdentityUpdates) {
    return updateAllowingIdentityChange(document, updateRequest, mongoCollection, session);
  }
  return updateDisallowingIdentityChange(document, updateRequest, mongoCollection, session);
}

/**
 * Takes an UpdateRequest and MongoClient from the BackendFacade and performs an update by documentUuid
 * and returns the UpdateResult.
 */
export async function updateDocumentByDocumentUuid(
  updateRequest: UpdateRequest,
  client: MongoClient,
): Promise<UpdateResult> {
  const { documentUuid, traceId } = updateRequest;
  Logger.info(`${moduleName}.updateDocumentByDocumentUuid ${documentUuid}`, traceId);

  const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
  const session: ClientSession = client.startSession();
  let updateResult: UpdateResult = { response: 'UNKNOWN_FAILURE' };

  try {
    const numberOfRetries: number = Config.get('MONGODB_MAX_NUMBER_OF_RETRIES');

    await retry(
      async () => {
        await session.withTransaction(async () => {
          updateResult = await updateDocumentByDocumentUuidTransaction(updateRequest, mongoCollection, session);
          if (updateResult.response !== 'UPDATE_SUCCESS') {
            await session.abortTransaction();
          }
        });
      },
      {
        retries: numberOfRetries,
        onRetry: () => {
          Logger.warn(
            `${moduleName}.updateDocumentByDocumentUuid got write conflict error for documentUuid ${updateRequest.documentUuid}. Retrying...`,
            updateRequest.traceId,
          );
        },
      },
    );
  } catch (e) {
    Logger.error(`${moduleName}.updateDocumentByDocumentUuid`, traceId, e);
    await session.abortTransaction();

    // If this is a MongoError, it has a codeName
    if (e.codeName === 'WriteConflict') {
      return {
        response: 'UPDATE_FAILURE_WRITE_CONFLICT',
        failureMessage: 'Write conflict due to concurrent access to this or related resources.',
      };
    }

    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }
  return updateResult;
}
