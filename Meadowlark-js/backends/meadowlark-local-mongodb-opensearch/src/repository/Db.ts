// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, Db, MongoClient } from 'mongodb';
import { Logger } from '@edfi//meadowlark-core';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';

const MONGO_URL: string = process.env.MONGO_URL ?? 'mongodb://mongo1:27017,mongo2:27018,mongo3:27019/?replicaSet=rs0';

const client: MongoClient = new MongoClient(MONGO_URL, { w: 'majority', readConcernLevel: 'majority' });

// IIFE for top-level await
(async () => {
  try {
    await client.connect();

    const db: Db = client.db('meadowlark');
    const documents: Collection<MeadowlarkDocument> = db.collection('documents');

    // Note this will trigger a time-consuming index build if the indexes do not already exist.
    documents.createIndex({ id: 1 }, { unique: true });
    documents.createIndex({ outRefs: 1 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    Logger.error(`Error connecting MongoDb URL: "${MONGO_URL}". Error was ${message}`, null);
    throw e;
  }
})();

export function getMongoCollection(): Collection<MeadowlarkDocument> {
  return client.db('meadowlark').collection('documents');
}

export function getClient(): MongoClient {
  return client;
}
