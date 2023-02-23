// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, ClientSession, MongoClient, WithId, FindOptions } from 'mongodb';
import { UpsertResult, UpsertRequest, documentIdForSuperclassInfo, BlockingDocument } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { MeadowlarkDocument, meadowlarkDocumentFrom } from '../model/MeadowlarkDocument';
import { getDocumentCollection, writeLockReferencedDocuments, asUpsert } from './Db';
import { onlyDocumentsReferencing, validateReferences } from './ReferenceValidation';

// MongoDB FindOption to return at most 5 documents
const limitFive = (session: ClientSession): FindOptions => ({ limit: 5, session });

const moduleName: string = 'mongodb.repository.Upsert';

export async function upsertDocument(
  { resourceInfo, documentInfo, documentUuid, meadowlarkId, edfiDoc, validate, traceId, security }: UpsertRequest,
  client: MongoClient,
): Promise<UpsertResult> {
  Logger.info(`${moduleName}.updateDocumentById ${documentUuid}`, traceId);

  const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
  const session: ClientSession = client.startSession();
  let upsertResult: UpsertResult = { response: 'UNKNOWN_FAILURE' };
  let newDocumentUuid = documentUuid;
  try {
    await session.withTransaction(async () => {
      const mongoDocument = await mongoCollection.findOne({ _id: meadowlarkId });
      // Check whether this is an insert or update
      const isInsert: boolean = mongoDocument == null;

      // If inserting a subclass, check whether the superclass identity is already claimed by a different subclass
      if (isInsert && documentInfo.superclassInfo != null) {
        const superclassAliasId: string = documentIdForSuperclassInfo(documentInfo.superclassInfo);
        const superclassAliasIdInUse: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne({
          aliasIds: superclassAliasId,
        });

        if (superclassAliasIdInUse) {
          Logger.warn(
            `${moduleName}.upsertDocument Upserting document uuid ${documentUuid} failed due to another subclass with the same identity`,
            traceId,
          );

          upsertResult = {
            response: 'INSERT_FAILURE_CONFLICT',
            failureMessage: `Insert failed: the identity is in use by '${resourceInfo.resourceName}' which is also a(n) '${documentInfo.superclassInfo.resourceName}'`,
            blockingDocuments: [
              {
                // eslint-disable-next-line no-underscore-dangle
                documentUuid: superclassAliasIdInUse.documentUuid,
                resourceName: superclassAliasIdInUse.resourceName,
                projectName: superclassAliasIdInUse.projectName,
                resourceVersion: superclassAliasIdInUse.resourceVersion,
              },
            ],
          };

          await session.abortTransaction();
          return;
        }
      } else if (mongoDocument != null) {
        newDocumentUuid = mongoDocument.documentUuid;
      }

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
            `${moduleName}.upsertDocument Upserting document uuid ${newDocumentUuid} failed due to invalid references`,
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

          upsertResult = {
            response: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE',
            failureMessage: { error: { message: 'Reference validation failed', failures } },
            blockingDocuments,
          };

          await session.abortTransaction();
          return;
        }
      }

      const document: MeadowlarkDocument = meadowlarkDocumentFrom(
        resourceInfo,
        documentInfo,
        newDocumentUuid,
        meadowlarkId,
        edfiDoc,
        validate,
        security.clientId,
      );

      await writeLockReferencedDocuments(mongoCollection, document.outboundRefs, session);
      // Perform the document upsert
      Logger.debug(`${moduleName}.upsertDocument Upserting document uuid ${newDocumentUuid}`, traceId);

      const { acknowledged, upsertedCount } = await mongoCollection.replaceOne(
        { _id: meadowlarkId },
        document,
        asUpsert(session),
      );
      if (acknowledged) {
        upsertResult.response = upsertedCount === 0 ? 'UPDATE_SUCCESS' : 'INSERT_SUCCESS';
      } else {
        const msg =
          'mongoCollection.replaceOne returned acknowledged: false, indicating a problem with write concern configuration';
        Logger.error(`${moduleName}.upsertDocument`, traceId, msg);
      }
    });
  } catch (e) {
    Logger.error(`${moduleName}.upsertDocument`, traceId, e);

    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return upsertResult;
}
