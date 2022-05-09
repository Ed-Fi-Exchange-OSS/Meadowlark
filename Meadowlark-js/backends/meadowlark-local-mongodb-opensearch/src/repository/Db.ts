// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { ClientSession, Collection, Db, MongoClient } from 'mongodb';
import { Logger } from '@edfi//meadowlark-core';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';

const MONGO_URL_DEFAULT = 'mongodb://mongo1:27017,mongo2:27018,mongo3:27019/?replicaSet=rs0';
const DB_NAME_DEFAULT = 'meadowlark';
const MONGO_COLLECTION_NAME_DEFAULT = 'documents';

let client: MongoClient | null = null;
let db: Db | null = null;
let collection: Collection<MeadowlarkDocument> | null = null;

export async function getClient(): Promise<MongoClient> {
  if (client == null) {
    const MONGO_URL: string = process.env.MONGO_URL ?? MONGO_URL_DEFAULT;
    const MONGO_DB_NAME: string = process.env.MONGO_DB_NAME ?? DB_NAME_DEFAULT;
    const MONGO_COLLECTION_NAME: string = process.env.MONGO_COLLECTION_NAME ?? MONGO_COLLECTION_NAME_DEFAULT;

    try {
      client = new MongoClient(MONGO_URL, { w: 'majority', readConcernLevel: 'majority' });
      await client.connect();

      db = client.db(MONGO_DB_NAME);
      collection = db.collection(MONGO_COLLECTION_NAME);

      // Note this does nothing if the indexes already exist (triggers an index build otherwise)
      collection.createIndex({ id: 1 }, { unique: true });
      collection.createIndex({ outRefs: 1 });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'unknown';
      Logger.error(`Error connecting MongoDb URL: "${MONGO_URL}". Error was ${message}`, null);
      throw e;
    }
  }

  return client;
}

export async function getDb(): Promise<Db> {
  if (db == null) {
    await getClient();
    if (db == null) {
      Logger.error('Db: Database create failed', null);
      throw new Error('Db: Database create failed');
    }
  }
  return db;
}

export async function getCollection(): Promise<Collection<MeadowlarkDocument>> {
  if (collection == null) {
    await getClient();
    if (collection == null) {
      Logger.error('Db: Database create failed', null);
      throw new Error('Db: Database create failed');
    }
  }
  return collection;
}

export async function startSession(): Promise<ClientSession> {
  return (await getClient()).startSession();
}
