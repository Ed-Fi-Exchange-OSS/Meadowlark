// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { CreateAuthorizationClientRequest } from '@edfi/meadowlark-authz-server';
import { Collection, MongoClient } from 'mongodb';
import { AuthorizationDocument } from '../../../src/model/AuthorizationDocument';
import { getAuthorizationCollection, getNewClient } from '../../../src/repository/Db';
import { tryCreateBootstrapAuthorizationAdminDocument } from '../../../src/repository/authorization/TryCreateBootstrapAuthorizationAdmin';
import { setupConfigForIntegration } from '../Config';

const clientId = 'clientId';

const newCreateAuthorizationClientRequest = (): CreateAuthorizationClientRequest => ({
  clientId,
  clientSecretHashed: 'clientSecretHashed',
  clientName: 'clientName',
  roles: ['admin'],
  traceId: 'traceId',
  active: true,
});

describe('given the first time create of a bootstrap admin client', () => {
  let mongoClient;
  let createClientRequest;

  beforeAll(async () => {
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;
    createClientRequest = await tryCreateBootstrapAuthorizationAdminDocument(
      newCreateAuthorizationClientRequest(),
      mongoClient,
    );
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
        "isBootstrapAdmin": true,
        "roles": [
          "admin",
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
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;

    mongoClient.close();
    createClientRequest = await tryCreateBootstrapAuthorizationAdminDocument(
      newCreateAuthorizationClientRequest(),
      mongoClient,
    );
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

  it('should return failure', async () => {
    expect(createClientRequest).toMatchInlineSnapshot(`
      {
        "response": "UNKNOWN_FAILURE",
      }
    `);
  });
});

describe('given two attempts at the create of a bootstrap admin client', () => {
  let mongoClient;
  let createClientRequest1;
  let createClientRequest2;

  beforeAll(async () => {
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;
    createClientRequest1 = await tryCreateBootstrapAuthorizationAdminDocument(
      newCreateAuthorizationClientRequest(),
      mongoClient,
    );
    createClientRequest2 = await tryCreateBootstrapAuthorizationAdminDocument(
      { ...newCreateAuthorizationClientRequest(), clientId: 'clientId2' },
      mongoClient,
    );
  });

  afterAll(async () => {
    await getAuthorizationCollection(mongoClient).deleteMany({});
    await mongoClient.close();
  });

  it('should have client 1 in the db', async () => {
    const collection: Collection<AuthorizationDocument> = getAuthorizationCollection(mongoClient);
    const result: any = await collection.findOne({ _id: clientId });
    expect(result).toMatchInlineSnapshot(`
      {
        "_id": "clientId",
        "active": true,
        "clientName": "clientName",
        "clientSecretHashed": "clientSecretHashed",
        "isBootstrapAdmin": true,
        "roles": [
          "admin",
        ],
      }
    `);
  });

  it('should return insert success on first attempt', async () => {
    expect(createClientRequest1).toMatchInlineSnapshot(`
      {
        "response": "CREATE_SUCCESS",
      }
    `);
  });

  it('should not have client 2 in the db', async () => {
    const collection: Collection<AuthorizationDocument> = getAuthorizationCollection(mongoClient);
    const result: any = await collection.findOne({ _id: 'clientId2' });
    expect(result).toBeNull();
  });

  it('should return already exists failure on second attempt', async () => {
    expect(createClientRequest2).toMatchInlineSnapshot(`
      {
        "response": "CREATE_FAILURE_ALREADY_EXISTS",
      }
    `);
  });
});
