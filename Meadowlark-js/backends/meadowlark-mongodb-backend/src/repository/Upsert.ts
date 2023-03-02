// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-underscore-dangle */

import { Collection, ClientSession, MongoClient, WithId } from 'mongodb';
import {
  UpsertResult,
  UpsertRequest,
  documentIdForSuperclassInfo,
  BlockingDocument,
  DocumentUuid,
} from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { MeadowlarkDocument, meadowlarkDocumentFrom } from '../model/MeadowlarkDocument';
import { writeLockReferencedDocuments, asUpsert, limitFive, getDocumentCollection, onlyReturnDocumentUuid } from './Db';
import { onlyDocumentsReferencing, validateReferences } from './ReferenceValidation';

const moduleName: string = 'mongodb.repository.Upsert';

export async function upsertDocumentTransaction(
  {
    resourceInfo,
    documentInfo,
    documentUuidForInsert,
    meadowlarkId,
    edfiDoc,
    validateDocumentReferencesExist,
    traceId,
    security,
  }: UpsertRequest,
  mongoCollection: Collection<MeadowlarkDocument>,
  session: ClientSession,
  documentFromUpdate?: MeadowlarkDocument,
): Promise<UpsertResult> {
  // Check whether this document exists in the db
  const existingDocument: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
    { _id: meadowlarkId },
    onlyReturnDocumentUuid(session),
  );

  // the documentUuid of the existing document if this is an update, or null if this is an insert
  const existingDocumentUuid: DocumentUuid | null = existingDocument?.documentUuid ?? null;

  // Check whether this is an insert or update
  const isInsert: boolean = existingDocumentUuid == null;

  // If inserting a subclass, check whether the superclass identity is already claimed by a different subclass
  if (isInsert && documentInfo.superclassInfo != null) {
    const superclassAliasId: string = documentIdForSuperclassInfo(documentInfo.superclassInfo);
    const superclassAliasIdInUse: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
      {
        aliasIds: superclassAliasId,
      },
      { session },
    );

    if (superclassAliasIdInUse) {
      Logger.warn(
        `${moduleName}.upsertDocumentTransaction insert failed due to another subclass with documentUuid ${superclassAliasIdInUse.documentUuid} and the same identity ${superclassAliasIdInUse._id}`,
        traceId,
      );

      return {
        response: 'INSERT_FAILURE_CONFLICT',
        failureMessage: `Insert failed: the identity is in use by '${resourceInfo.resourceName}' which is also a(n) '${documentInfo.superclassInfo.resourceName}'`,
        blockingDocuments: [
          {
            documentUuid: superclassAliasIdInUse.documentUuid,
            resourceName: superclassAliasIdInUse.resourceName,
            projectName: superclassAliasIdInUse.projectName,
            resourceVersion: superclassAliasIdInUse.resourceVersion,
          },
        ],
      };
    }
  }

  if (validateDocumentReferencesExist) {
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
        `${moduleName}.upsertDocumentTransaction Upserting document uuid ${
          existingDocumentUuid ?? documentUuidForInsert
        } failed due to invalid references`,
        traceId,
      );

      const referringDocuments: WithId<MeadowlarkDocument>[] = await mongoCollection
        .find(onlyDocumentsReferencing([meadowlarkId]), limitFive(session))
        .toArray();

      const blockingDocuments: BlockingDocument[] = referringDocuments.map((document) => ({
        documentUuid: document._id,
        resourceName: document.resourceName,
        projectName: document.projectName,
        resourceVersion: document.resourceVersion,
      }));

      return {
        response: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE',
        failureMessage: { error: { message: 'Reference validation failed', failures } },
        blockingDocuments,
      };
    }
  }

  const document: MeadowlarkDocument =
    documentFromUpdate ??
    meadowlarkDocumentFrom(
      resourceInfo,
      documentInfo,
      existingDocumentUuid ?? documentUuidForInsert,
      meadowlarkId,
      edfiDoc,
      validateDocumentReferencesExist,
      security.clientId,
    );

  await writeLockReferencedDocuments(mongoCollection, document.outboundRefs, session);
  // Perform the document upsert
  Logger.debug(
    `${moduleName}.upsertDocumentTransaction Upserting document uuid ${existingDocumentUuid ?? documentUuidForInsert}`,
    traceId,
  );

  const { acknowledged, upsertedCount, modifiedCount } = await mongoCollection.replaceOne(
    { _id: meadowlarkId },
    document,
    asUpsert(session),
  );

  if (!acknowledged) {
    const msg =
      'mongoCollection.replaceOne returned acknowledged: false, indicating a problem with write concern configuration';
    Logger.error(`${moduleName}.upsertDocumentTransaction`, traceId, msg);

    return { response: 'UNKNOWN_FAILURE' };
  }

  // upsertedCount is the number of inserted documents
  if (upsertedCount > 0) return { response: 'INSERT_SUCCESS' };

  // modifiedCount is the number of updated documents
  if (modifiedCount === 0 || existingDocumentUuid == null) {
    // Something unexpected happened. This should have been an update
    const msg = `Expected document update, but was not for documentUuid ${document.documentUuid} and meadowlarkId ${document._id}`;
    Logger.error(`${moduleName}.upsertDocumentTransaction`, traceId, msg);
    return { response: 'UNKNOWN_FAILURE' };
  }

  return { response: 'UPDATE_SUCCESS', existingDocumentUuid };
}

/**
 * Takes an UpsertResult and MongoClient from the BackendFacade, performs an upsert and returns the UpsertResult.
 */
export async function upsertDocument(upsertRequest: UpsertRequest, client: MongoClient): Promise<UpsertResult> {
  const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
  const session: ClientSession = client.startSession();
  let upsertResult: UpsertResult = { response: 'UNKNOWN_FAILURE' };
  try {
    await session.withTransaction(async () => {
      upsertResult = await upsertDocumentTransaction(upsertRequest, mongoCollection, session);
      if (upsertResult.response !== 'UPDATE_SUCCESS' && upsertResult.response !== 'INSERT_SUCCESS') {
        await session.abortTransaction();
      }
    });
  } catch (e) {
    Logger.error(`${moduleName}.upsertDocument`, upsertRequest.traceId, e);
    await session.abortTransaction();
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }
  return upsertResult;
}
