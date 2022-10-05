// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { CreateClientRequest } from '@edfi/meadowlark-authz-server';
import { Collection, MongoClient } from 'mongodb';
import { AuthorizationClient } from '../../../src/model/AuthorizationClient';
import { getAuthorizationCollection, getNewClient } from '../../../src/repository/Db';
import { createAuthorizationClient } from '../../../src/repository/authorization/CreateAuthorizationClient';

jest.setTimeout(40000);

const clientId = 'clientId';

const newCreateClientRequest = (): CreateClientRequest => ({
  clientId,
  clientSecret: 'clientSecret',
  clientName: 'clientName',
  roles: ['vendor'],
  traceId: 'traceId',
});

describe('given the create of a new authorization client', () => {
  let mongoClient;
  let createClientRequest;

  beforeAll(async () => {
    mongoClient = (await getNewClient()) as MongoClient;
    createClientRequest = await createAuthorizationClient(newCreateClientRequest(), mongoClient);
  });

  afterAll(async () => {
    await getAuthorizationCollection(mongoClient).deleteMany({});
    await mongoClient.close();
  });

  it('should exist in the db', async () => {
    const collection: Collection<AuthorizationClient> = getAuthorizationCollection(mongoClient);
    const result: any = await collection.findOne({ _id: clientId });
    expect(result).toMatchInlineSnapshot(`
      {
        "_id": "clientId",
        "clientName": "clientName",
        "clientSecret": "clientSecret",
        "roles": [
          "vendor",
        ],
      }
    `);
  });

  it('should return insert success', async () => {
    expect(createClientRequest).toMatchInlineSnapshot(`
      {
        "response": "CREATE_SUCCESS",
      }
    `);
  });
});

describe('given a closed MongoDB connection', () => {
  let mongoClient;
  let createClientRequest;

  beforeAll(async () => {
    mongoClient = (await getNewClient()) as MongoClient;

    mongoClient.close();
    createClientRequest = await createAuthorizationClient(newCreateClientRequest(), mongoClient);
    mongoClient = (await getNewClient()) as MongoClient;
  });

  afterAll(async () => {
    await getAuthorizationCollection(mongoClient).deleteMany({});
    await mongoClient.close();
  });

  it('should not exist in the db', async () => {
    const collection: Collection<AuthorizationClient> = getAuthorizationCollection(mongoClient);
    const result: any = await collection.findOne({ _id: clientId });
    expect(result).toBeNull();
  });

  it('should return failure', async () => {
    expect(createClientRequest).toMatchInlineSnapshot(`
      {
        "response": "UNKNOWN_FAILURE",
      }
    `);
  });
});
