// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { CreateAuthorizationClientRequest, GetAuthorizationClientRequest } from '@edfi/meadowlark-authz-server';
import { Collection, MongoClient } from 'mongodb';
import { AuthorizationDocument } from '../../../src/model/AuthorizationDocument';
import { getAuthorizationCollection, getNewClient } from '../../../src/repository/Db';
import { createAuthorizationClientDocument } from '../../../src/repository/authorization/CreateAuthorizationClient';
import { getAuthorizationClientDocument } from '../../../src/repository/authorization/GetAuthorizationClient';
import { setupConfigForIntegration } from '../Config';

const clientId = 'clientId';

const newCreateAuthorizationClientRequest = (): CreateAuthorizationClientRequest => ({
  clientId,
  clientSecretHashed: 'clientSecretHashed',
  clientName: 'clientName',
  roles: ['vendor'],
  traceId: 'traceId',
  active: true,
});

const newGetAuthorizationClientRequest = (): GetAuthorizationClientRequest => ({
  clientId,
  traceId: 'traceId',
});

describe('given the get of an existing authorization client', () => {
  let mongoClient;
  let getClientRequest;

  beforeAll(async () => {
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;
    // create the client
    await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(), mongoClient);

    getClientRequest = await getAuthorizationClientDocument(newGetAuthorizationClientRequest(), mongoClient);
  });

  afterAll(async () => {
    await getAuthorizationCollection(mongoClient).deleteMany({});
    await mongoClient.close();
  });

  it('should exist in the db', async () => {
    const collection: Collection<AuthorizationDocument> = getAuthorizationCollection(mongoClient);
    const result: any = await collection.findOne({ _id: clientId });
    expect(result).toMatchInlineSnapshot(`
      {
        "_id": "clientId",
        "active": true,
        "clientName": "clientName",
        "clientSecretHashed": "clientSecretHashed",
        "isBootstrapAdmin": false,
        "roles": [
          "vendor",
        ],
      }
    `);
  });

  it('should return get success', async () => {
    expect(getClientRequest).toMatchInlineSnapshot(`
      {
        "active": true,
        "clientName": "clientName",
        "clientSecretHashed": "clientSecretHashed",
        "response": "GET_SUCCESS",
        "roles": [
          "vendor",
        ],
      }
    `);
  });
});

describe('given the get of a non-existent authorization client', () => {
  let mongoClient;
  let getClientRequest;

  beforeAll(async () => {
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;
    getClientRequest = await getAuthorizationClientDocument(newGetAuthorizationClientRequest(), mongoClient);
  });

  afterAll(async () => {
    await getAuthorizationCollection(mongoClient).deleteMany({});
    await mongoClient.close();
  });

  it('should not exist in the db', async () => {
    const collection: Collection<AuthorizationDocument> = getAuthorizationCollection(mongoClient);
    const result: any = await collection.findOne({ _id: clientId });
    expect(result).toBeNull();
  });

  it('should return get not exists', async () => {
    expect(getClientRequest).toMatchInlineSnapshot(`
      {
        "response": "GET_FAILURE_NOT_EXISTS",
      }
    `);
  });
});

describe('given a closed MongoDB connection', () => {
  let mongoClient;
  let getClientRequest;

  beforeAll(async () => {
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;

    mongoClient.close();
    getClientRequest = await getAuthorizationClientDocument(newGetAuthorizationClientRequest(), mongoClient);
    mongoClient = (await getNewClient()) as MongoClient;
  });

  afterAll(async () => {
    await getAuthorizationCollection(mongoClient).deleteMany({});
    await mongoClient.close();
  });

  it('should not exist in the db', async () => {
    const collection: Collection<AuthorizationDocument> = getAuthorizationCollection(mongoClient);
    const result: any = await collection.findOne({ _id: clientId });
    expect(result).toBeNull();
  });

  it('should return not found', async () => {
    expect(getClientRequest).toMatchInlineSnapshot(`
      {
        "response": "GET_FAILURE_NOT_EXISTS",
      }
    `);
  });
});
