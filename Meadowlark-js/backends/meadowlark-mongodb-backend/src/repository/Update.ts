// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { UpdateResult, UpdateRequest, BlockingDocument } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { Collection, ClientSession, MongoClient, WithId, FindOptions } from 'mongodb';
import { MeadowlarkDocument, meadowlarkDocumentFrom } from '../model/MeadowlarkDocument';
import { getDocumentCollection, writeLockReferencedDocuments } from './Db';
import { deleteDocumentById } from './Delete';
import { onlyDocumentsReferencing, validateReferences } from './ReferenceValidation';
import { upsertDocument } from './Upsert';

// MongoDB FindOption to return at most 5 documents
const limitFive = (session: ClientSession): FindOptions => ({ limit: 5, session });
const moduleName: string = 'mongodb.repository.Update';

export async function updateDocumentById(
  { id, documentUuid, resourceInfo, documentInfo, edfiDoc, validate, traceId, security }: UpdateRequest,
  client: MongoClient,
): Promise<UpdateResult> {
  Logger.info(`${moduleName}.updateDocumentById ${documentUuid}`, traceId);

  const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
  const session: ClientSession = client.startSession();
  const meadowlarkId = id;
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
            .find(onlyDocumentsReferencing([id]), limitFive(session))
            .toArray();

          const blockingDocuments: BlockingDocument[] = referringDocuments.map((document) => ({
            // eslint-disable-next-line no-underscore-dangle
            documentId: document._id,
            resourceName: document.resourceName,
            projectName: document.projectName,
            resourceVersion: document.resourceVersion,
          }));

          updateResult = {
            response: 'UPDATE_FAILURE_REFERENCE',
            failureMessage: { message: 'Reference validation failed', failures },
            blockingDocuments,
          };

          await session.abortTransaction();
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

      // Perform the document update
      Logger.debug(`${moduleName}.updateDocumentById: Updating document uuid ${documentUuid}`, traceId);

      // if resourceInfo.allowIdentityUpdates is true, the process deletes de old document and inserts a new document.
      if (resourceInfo.allowIdentityUpdates) {
        const deleteResult = await deleteDocumentById(
          { id: documentUuid, resourceInfo, security, validate: true, traceId },
          client,
        );
        // if the document was deleted, it should insert the new version.
        if (deleteResult.response === 'DELETE_SUCCESS') {
          // insert the updated document.
          const upsertResult = await upsertDocument(
            { resourceInfo, documentInfo, documentUuid, id, edfiDoc, validate, traceId, security },
            client,
          );
          if (upsertResult.response === 'INSERT_SUCCESS') {
            updateResult.response = 'UPDATE_SUCCESS';
          } else {
            updateResult.response = 'UPDATE_FAILURE_NOT_EXISTS';
          }
        } else if (deleteResult.response === 'DELETE_FAILURE_NOT_EXISTS') {
          updateResult.response = 'UPDATE_FAILURE_NOT_EXISTS';
        }
      } else {
        const { acknowledged, matchedCount } = await mongoCollection.replaceOne(
          { _id: meadowlarkId, documentUuid },
          document,
          {
            session,
          },
        );
        if (acknowledged) {
          updateResult.response = matchedCount > 0 ? 'UPDATE_SUCCESS' : 'UPDATE_FAILURE_NOT_EXISTS';
        } else {
          const msg =
            'mongoCollection.replaceOne returned acknowledged: false, indicating a problem with write concern configuration';
          Logger.error(`${moduleName}.updateDocumentById`, traceId, msg);
        }
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
