// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendResponse, get, upsert } from '@edfi/meadowlark-core';
import { getNewClient, getCollection, resetSharedClient } from '@edfi/meadowlark-mongodb-backend';
import { MongoClient } from 'mongodb';
import {
  schoolBodyClient1,
  MONGO_DOCUMENT_STORE_PLUGIN,
  TEST_SIGNING_KEY,
  schoolGetClient2,
  schoolGetClient1,
} from './SystemTestSetup';

jest.setTimeout(40000);
process.env.DOCUMENT_STORE_PLUGIN = MONGO_DOCUMENT_STORE_PLUGIN;
process.env.SIGNING_KEY = TEST_SIGNING_KEY;

describe('given a GET of a non-existent school', () => {
  let client: MongoClient;
  let getResult: FrontendResponse;

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    await getCollection(client).deleteMany({});

    // Act
    getResult = await get(schoolGetClient1());
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
    await resetSharedClient();
  });

  it('should return not found', async () => {
    expect(getResult.body).toEqual('');
    expect(getResult.statusCode).toBe(404);
  });
});

describe('given a POST of a school by one client followed by a GET of the school by a second client', () => {
  let client: MongoClient;
  let getResult: FrontendResponse;

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    await getCollection(client).deleteMany({});

    await upsert(schoolBodyClient1());

    // Act
    getResult = await get(schoolGetClient2());
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
    await resetSharedClient();
  });

  it('should return get as a 403 forbidden', async () => {
    expect(getResult.body).toEqual('');
    expect(getResult.statusCode).toBe(403);
  });
});
