// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, MongoClient } from 'mongodb';
import { Logger } from '@edfi//meadowlark-core';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';

const MONGO_URL_DEFAULT = 'mongodb://mongo1:27017,mongo2:27018,mongo3:27019/meadowlark?replicaSet=rs0';
export const COLLECTION_NAME = 'documents';

let singletonClient: MongoClient | null = null;

/**
 * Return a brand new client - which is a connection pool. Only use for testing purposes.
 */
export async function getNewClient(): Promise<MongoClient> {
  // eslint-disable-next-line no-underscore-dangle
  const MONGO_URL: string = process.env.MONGO_URL ?? (global as any).__MONGO_URI__ ?? MONGO_URL_DEFAULT;

  try {
    const newClient = new MongoClient(MONGO_URL, { w: 'majority', readConcernLevel: 'majority' });
    await newClient.connect();

    const collection = newClient.db().collection(COLLECTION_NAME);

    // Note this does nothing if the indexes already exist (triggers an index build otherwise)
    await collection.createIndex({ id: 1 }, { unique: true });
    await collection.createIndex({ outRefs: 1 });

    return newClient;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    Logger.error(`Error connecting MongoDb URL: "${MONGO_URL}". Error was ${message}`, null);
    throw e;
  }
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

export function getCollection(client: MongoClient): Collection<MeadowlarkDocument> {
  return client.db().collection(COLLECTION_NAME);
}
