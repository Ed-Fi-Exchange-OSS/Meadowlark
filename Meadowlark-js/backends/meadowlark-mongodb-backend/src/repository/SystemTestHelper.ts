// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MongoClient } from 'mongodb';
import { getCollection, getNewClient, resetSharedClient } from './Db';

export async function systemTestSetup(): Promise<MongoClient> {
  const client = (await getNewClient()) as MongoClient;
  await getCollection(client).deleteMany({});
  return client;
}

export async function systemTestTeardown(client: MongoClient): Promise<void> {
  await getCollection(client).deleteMany({});
  await client.close();
  await resetSharedClient();
}
