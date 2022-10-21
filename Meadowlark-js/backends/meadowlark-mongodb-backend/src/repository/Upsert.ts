// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, ClientSession, MongoClient } from 'mongodb';
import { UpsertResult, UpsertRequest, documentIdForSuperclassInfo } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { MeadowlarkDocument, meadowlarkDocumentFrom } from '../model/MeadowlarkDocument';
import { getDocumentCollection, onlyReturnId, writeLockReferencedDocuments, asUpsert } from './Db';
import { validateReferences } from './ReferenceValidation';

export async function upsertDocument(
  { resourceInfo, documentInfo, id, edfiDoc, validate, traceId, security }: UpsertRequest,
  client: MongoClient,
): Promise<UpsertResult> {
  const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
  const session: ClientSession = client.startSession();

  let upsertResult: UpsertResult = { response: 'UNKNOWN_FAILURE' };

  try {
    await session.withTransaction(async () => {
      // Check whether this is an insert or update
      const isInsert: boolean = (await mongoCollection.findOne({ _id: id }, onlyReturnId(session))) == null;

      // If inserting a subclass, check whether the superclass identity is already claimed by a different subclass
      if (isInsert && documentInfo.superclassInfo != null) {
        const superclassAliasId: string = documentIdForSuperclassInfo(documentInfo.superclassInfo);
        const superclassAliasIdInUse: boolean =
          (await mongoCollection.findOne({ aliasIds: superclassAliasId }, onlyReturnId(session))) != null;

        if (superclassAliasIdInUse) {
          Logger.debug(
            `mongodb.repository.Upsert.upsertDocument: Upserting document id ${id} failed due to another subclass with the same identity`,
            traceId,
          );

          upsertResult = {
            response: 'INSERT_FAILURE_CONFLICT',
            failureMessage: `Insert failed: the identity is in use by '${resourceInfo.resourceName}' which is also a(n) '${documentInfo.superclassInfo.resourceName}'`,
          };

          await session.abortTransaction();
          return;
        }
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
            `mongodb.repository.Upsert.upsertDocument: Upserting document id ${id} failed due to invalid references`,
            traceId,
          );

          upsertResult = {
            response: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE',
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

      // Perform the document upsert
      Logger.debug(`mongodb.repository.Upsert.upsertDocument: Upserting document id ${id}`, traceId);

      const { acknowledged, upsertedCount } = await mongoCollection.replaceOne({ _id: id }, document, asUpsert(session));
      if (acknowledged) {
        upsertResult.response = upsertedCount === 0 ? 'UPDATE_SUCCESS' : 'INSERT_SUCCESS';
      } else {
        const msg =
          'mongoCollection.replaceOne returned acknowledged: false, indicating a problem with write concern configuration';
        Logger.error('mongodb.repository.Upsert.upsertDocument', traceId, msg);
      }
    });
  } catch (e) {
    Logger.error('mongodb.repository.Upsert.upsertDocument', traceId, e);

    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return upsertResult;
}
