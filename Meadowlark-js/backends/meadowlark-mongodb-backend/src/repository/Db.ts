// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, MongoClient, ReadConcernLevel, W, ClientSession, ObjectId, FindOptions, ReplaceOptions } from 'mongodb';
import { Logger, Config } from '@edfi//meadowlark-utilities';
import { MeadowlarkId } from '@edfi/meadowlark-core';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { AuthorizationDocument } from '../model/AuthorizationDocument';

export const DOCUMENT_COLLECTION_NAME = 'documents';
export const AUTHORIZATION_COLLECTION_NAME = 'authorizations';

let singletonClient: MongoClient | null = null;

/**
 * Return a brand new client - which is a connection pool.
 */
export async function getNewClient(): Promise<MongoClient> {
  const mongoUrl: string = Config.get('MONGO_URI');
  const databaseName: string = Config.get('MEADOWLARK_DATABASE_NAME');

  try {
    const newClient: MongoClient = new MongoClient(mongoUrl, {
      w: Config.get<string>('MONGO_WRITE_CONCERN') as W,
      readConcernLevel: Config.get<string>('MONGO_READ_CONCERN') as ReadConcernLevel,
    });
    await newClient.connect();

    // Create indexed documents collection if not exists
    const documentCollection: Collection<MeadowlarkDocument> = newClient
      .db(databaseName)
      .collection(DOCUMENT_COLLECTION_NAME);
    await documentCollection.createIndex({ documentUuid: 1 });
    await documentCollection.createIndex({ outboundRefs: 1 });
    await documentCollection.createIndex({ aliasMeadowlarkIds: 1 });

    // Create authorizations collection if not exists
    const authorizationCollection: Collection<AuthorizationDocument> = newClient
      .db(databaseName)
      .collection(AUTHORIZATION_COLLECTION_NAME);
    await authorizationCollection.createIndex({ clientName: 1 });

    return newClient;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    Logger.error(`Error connecting MongoDb URL: "${mongoUrl}". Error was ${message}`, null);
    throw e;
  }
}

/**
 * Close and discard the current shared client. Only use for testing purposes.
 */
export async function resetSharedClient(): Promise<void> {
  if (singletonClient != null) {
    await singletonClient.close();
  }
  singletonClient = null;
}

/**
 * Close and discard the current shared client. Only use for testing purposes.
 */
export async function closeSharedConnection(): Promise<void> {
  if (singletonClient != null) {
    await singletonClient.close();
  }
  singletonClient = null;
  Logger.info(`MongoDb connection: closed`, null);
}

/**
 * Return the shared client
 */
export async function getSharedClient(): Promise<MongoClient> {
  if (singletonClient == null) {
    singletonClient = await getNewClient();
  }
  return singletonClient;
}

export function getDocumentCollection(client: MongoClient): Collection<MeadowlarkDocument> {
  return client.db(Config.get<string>('MEADOWLARK_DATABASE_NAME')).collection(DOCUMENT_COLLECTION_NAME);
}

export function getAuthorizationCollection(client: MongoClient): Collection<AuthorizationDocument> {
  return client.db(Config.get<string>('MEADOWLARK_DATABASE_NAME')).collection(AUTHORIZATION_COLLECTION_NAME);
}

/**
 * Write lock referenced documents as part of the upsert/update process. This will prevent the issue of
 * a concurrent delete operation removing a to-be referenced document in the middle of the transaction.
 * See https://www.mongodb.com/blog/post/how-to-select--for-update-inside-mongodb-transactions
 *
 * This function expects Session to have an active transaction. Aborting the transaction on error is left to the caller.
 */
export async function writeLockReferencedDocuments(
  mongoCollection: Collection<MeadowlarkDocument>,
  referencedMeadowlarkIds: MeadowlarkId[],
  session: ClientSession,
): Promise<void> {
  await mongoCollection.updateMany(
    { aliasMeadowlarkIds: { $in: referencedMeadowlarkIds } },
    { $set: { lock: new ObjectId() } },
    { session },
  );
}

// MongoDB FindOption to return only the indexed _id field, making this a covered query (MongoDB will optimize)
export const onlyReturnId = (session: ClientSession): FindOptions => ({ projection: { _id: 1 }, session });

// MongoDB FindOption to return only createdAt and lastModifiedAt
export const onlyReturnTimestamps = (session: ClientSession): FindOptions => ({
  projection: { createdAt: 1, lastModifiedAt: 1 },
  session,
});

// MongoDB FindOption to return the indexed documentUuid and the createdAt and lastModifiedAt fields
export const onlyReturnDocumentUuidAndTimestamps = (session: ClientSession): FindOptions => ({
  projection: { documentUuid: 1, createdAt: 1, lastModifiedAt: 1 },
  session,
});

// MongoDB FindOption to return only the aliasId
export const onlyReturnAliasMeadowlarkId = (session: ClientSession): FindOptions => ({
  projection: { 'aliasMeadowlarkIds.$': 1 },
  session,
});

// MongoDB ReplaceOption that enables upsert (insert if not exists)
export const asUpsert = (session: ClientSession): ReplaceOptions => ({ upsert: true, session });

// MongoDB FindOption to return at most 5 documents
export const limitFive = (session: ClientSession): FindOptions => ({ limit: 5, session });
