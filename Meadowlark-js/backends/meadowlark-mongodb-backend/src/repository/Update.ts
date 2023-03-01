// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { UpdateResult, UpdateRequest, BlockingDocument } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { Collection, ClientSession, MongoClient, WithId, FindOptions } from 'mongodb';
import { MeadowlarkDocument, meadowlarkDocumentFrom } from '../model/MeadowlarkDocument';
import { getDocumentCollection, writeLockReferencedDocuments } from './Db';
import { deleteDocumentByIdTransaction } from './Delete';
import { onlyDocumentsReferencing, validateReferences } from './ReferenceValidation';
import { upsertDocumentTransaction } from './Upsert';

// MongoDB FindOption to return at most 5 documents
const limitFive = (session: ClientSession): FindOptions => ({ limit: 5, session });
const moduleName: string = 'mongodb.repository.Update';

async function updateDocumentByIdAllowIdentityUpdates(
  { meadowlarkId, documentUuid, resourceInfo, documentInfo, edfiDoc, validate, traceId, security }: UpdateRequest,
  client: MongoClient,
  session: ClientSession,
): Promise<UpdateResult> {
  let updateResult: UpdateResult = { response: 'UNKNOWN_FAILURE' };
  const deleteResult = await deleteDocumentByIdTransaction(
    { documentUuid, resourceInfo, security, validate: true, traceId },
    client,
    session,
  );
  Logger.debug(`${moduleName}.updateDocumentById: Updating document uuid ${documentUuid}`, traceId);
  // if the document was deleted, it should insert the new version.
  if (deleteResult.response === 'DELETE_SUCCESS') {
    // insert the updated document.
    const upsertResult = await upsertDocumentTransaction(
      {
        resourceInfo,
        documentInfo,
        documentUuidInserted: documentUuid,
        meadowlarkId,
        edfiDoc,
        validate,
        traceId,
        security,
      },
      client,
      session,
    );
    if (upsertResult.response === 'INSERT_SUCCESS') {
      updateResult = { response: 'UPDATE_SUCCESS' };
    } else {
      updateResult = { response: 'UPDATE_FAILURE_NOT_EXISTS' };
    }
  } else if (deleteResult.response === 'DELETE_FAILURE_NOT_EXISTS') {
    updateResult = { response: 'UPDATE_FAILURE_NOT_EXISTS' };
  }
  return updateResult;
}

async function updateDocumentByIdNaturalKeyProtected(
  { meadowlarkId, documentUuid, traceId }: UpdateRequest,
  mongoCollection: Collection<MeadowlarkDocument>,
  document: MeadowlarkDocument,
  session: ClientSession,
): Promise<UpdateResult> {
  let updateResult: UpdateResult = { response: 'UNKNOWN_FAILURE' };
  // Perform the document update
  Logger.debug(`${moduleName}.updateDocumentById: Updating document uuid ${documentUuid}`, traceId);
  const documentToUpdate = await mongoCollection.findOne({ documentUuid }, { projection: { _id: 1 } });
  // eslint-disable-next-line no-underscore-dangle
  if (documentToUpdate !== null && documentToUpdate._id !== meadowlarkId) {
    // This function cannot update a natural key.
    updateResult = {
      response: 'UPDATE_FAILURE_NATURAL_KEY',
    };
  } else {
    const { acknowledged, matchedCount } = await mongoCollection.replaceOne({ _id: meadowlarkId, documentUuid }, document, {
      session,
    });
    if (acknowledged) {
      updateResult = {
        response: matchedCount > 0 ? 'UPDATE_SUCCESS' : 'UPDATE_FAILURE_NOT_EXISTS',
      };
    } else {
      const msg =
        'mongoCollection.replaceOne returned acknowledged: false, indicating a problem with write concern configuration';
      Logger.error(`${moduleName}.updateDocumentById`, traceId, msg);
    }
  }
  return updateResult;
}

export async function updateDocumentById(
  { meadowlarkId, documentUuid, resourceInfo, documentInfo, edfiDoc, validate, traceId, security }: UpdateRequest,
  client: MongoClient,
): Promise<UpdateResult> {
  Logger.info(`${moduleName}.updateDocumentById ${documentUuid}`, traceId);

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
            `${moduleName}.updateDocumentById: Updating document uuid ${documentUuid} failed due to invalid references`,
            traceId,
          );

          const referringDocuments: WithId<MeadowlarkDocument>[] = await mongoCollection
            .find(onlyDocumentsReferencing([meadowlarkId]), limitFive(session))
            .toArray();

          const blockingDocuments: BlockingDocument[] = referringDocuments.map((document) => ({
            // eslint-disable-next-line no-underscore-dangle
            documentUuid: document._id,
            resourceName: document.resourceName,
            projectName: document.projectName,
            resourceVersion: document.resourceVersion,
          }));

          updateResult = {
            response: 'UPDATE_FAILURE_REFERENCE',
            failureMessage: { message: 'Reference validation failed', failures },
            blockingDocuments,
          };
          return;
        }
      }
      const document: MeadowlarkDocument = meadowlarkDocumentFrom(
        resourceInfo,
        documentInfo,
        documentUuid,
        meadowlarkId,
        edfiDoc,
        validate,
        security.clientId,
      );
      await writeLockReferencedDocuments(mongoCollection, document.outboundRefs, session);
      if (resourceInfo.allowIdentityUpdates) {
        updateResult = await updateDocumentByIdAllowIdentityUpdates(
          { meadowlarkId, documentUuid, resourceInfo, documentInfo, edfiDoc, validate, traceId, security } as UpdateRequest,
          client,
          session,
        );
      } else {
        updateResult = await updateDocumentByIdNaturalKeyProtected(
          { meadowlarkId, documentUuid, traceId } as UpdateRequest,
          mongoCollection,
          document,
          session,
        );
      }
    });
  } catch (e) {
    Logger.error(`${moduleName}.updateDocumentById`, traceId, e);
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }
  return updateResult;
}
