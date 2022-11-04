// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  Collection,
  MongoClient,
  Logger as MongoLogger,
  LoggerLevel,
  ReadConcernLevel,
  W,
  ClientSession,
  ObjectId,
  FindOptions,
  ReplaceOptions,
} from 'mongodb';
import { Logger } from '@edfi//meadowlark-utilities';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { AuthorizationDocument } from '../model/AuthorizationDocument';

const MONGO_URL_DEFAULT = 'mongodb://mongo1:27017,mongo2:27018,mongo3:27019/?replicaSet=rs0';
export const DATABASE_NAME = process.env.MEADOWLARK_DATABASE_NAME ?? 'meadowlark';
export const DOCUMENT_COLLECTION_NAME = 'documents';
export const AUTHORIZATION_COLLECTION_NAME = 'authorizations';

let singletonClient: MongoClient | null = null;

const MONGO_LOG_LEVEL: string = process.env.MONGO_LOG_LEVEL != null ? process.env.MONGO_LOG_LEVEL.toLowerCase() : 'error';
const MONGO_WRITE_CONCERN: W = (process.env.MONGO_WRITE_CONCERN as W) ?? 'majority';
const MONGO_READ_CONCERN: ReadConcernLevel = (process.env.MONGO_READ_CONCERN as ReadConcernLevel) ?? 'majority';

/**
 * Return a brand new client - which is a connection pool.
 */
export async function getNewClient(): Promise<MongoClient> {
  const mongoUrl = process.env.MONGO_URL ?? MONGO_URL_DEFAULT;

  try {
    const newClient: MongoClient = new MongoClient(mongoUrl, {
      w: MONGO_WRITE_CONCERN,
      readConcernLevel: MONGO_READ_CONCERN,
    });
    await newClient.connect();

    MongoLogger.setLevel(MONGO_LOG_LEVEL as LoggerLevel);

    // Create indexed documents collection if not exists
    const documentCollection: Collection<MeadowlarkDocument> = newClient
      .db(DATABASE_NAME)
      .collection(DOCUMENT_COLLECTION_NAME);
    await documentCollection.createIndex({ outboundRefs: 1 });
    await documentCollection.createIndex({ aliasIds: 1 });

    // Create authorizations collection if not exists
    const authorizationCollection: Collection<AuthorizationDocument> = newClient
      .db(DATABASE_NAME)
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
 * Return the shared client
 */
export async function getSharedClient(): Promise<MongoClient> {
  if (singletonClient == null) {
    singletonClient = await getNewClient();
  }

  return singletonClient;
}

export function getDocumentCollection(client: MongoClient): Collection<MeadowlarkDocument> {
  return client.db(DATABASE_NAME).collection(DOCUMENT_COLLECTION_NAME);
}

export function getAuthorizationCollection(client: MongoClient): Collection<AuthorizationDocument> {
  return client.db(DATABASE_NAME).collection(AUTHORIZATION_COLLECTION_NAME);
}

/**
 * Write lock referenced documents as part of the upsert/update process. This will prevent the issue of
 * a concurrent delete operation removing a to-be referenced document in the middle of the transaction.
 * See https://www.mongodb.com/blog/post/how-to-select--for-update-inside-mongodb-transactions
 */
export async function writeLockReferencedDocuments(
  mongoCollection: Collection<MeadowlarkDocument>,
  referencedDocumentIds: string[],
  session: ClientSession,
): Promise<void> {
  await mongoCollection.updateMany(
    { aliasIds: { $in: referencedDocumentIds } },
    { $set: { lock: new ObjectId() } },
    { session },
  );
}

// MongoDB FindOption to return only the indexed _id field, making this a covered query (MongoDB will optimize)
export const onlyReturnId = (session: ClientSession): FindOptions => ({ projection: { _id: 1 }, session });

// MongoDB ReplaceOption that enables upsert (insert if not exists)
export const asUpsert = (session: ClientSession): ReplaceOptions => ({ upsert: true, session });
