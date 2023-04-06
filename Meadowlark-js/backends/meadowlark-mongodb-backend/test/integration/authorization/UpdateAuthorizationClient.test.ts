// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { CreateAuthorizationClientRequest, UpdateAuthorizationClientRequest } from '@edfi/meadowlark-authz-server';
import { Collection, MongoClient } from 'mongodb';
import { AuthorizationDocument } from '../../../src/model/AuthorizationDocument';
import { getAuthorizationCollection, getNewClient } from '../../../src/repository/Db';
import { updateAuthorizationClientDocument } from '../../../src/repository/authorization/UpdateAuthorizationClient';
import { createAuthorizationClientDocument } from '../../../src/repository/authorization/CreateAuthorizationClient';
import { setupConfigForIntegration } from '../Config';

const clientIdSame = 'clientIdSame';
const clientIdDifferent = 'clientIdDifferent';

const newCreateAuthorizationClientRequest = (clientId: string): CreateAuthorizationClientRequest => ({
  clientId,
  clientSecretHashed: 'clientSecretHashed',
  clientName: 'clientName',
  roles: ['vendor'],
  traceId: 'traceId',
  active: true,
});

const newUpdateAuthorizationClientRequest = (clientId: string): UpdateAuthorizationClientRequest => ({
  clientId,
  clientName: 'clientNameChanged',
  roles: ['host'],
  traceId: 'traceId',
  active: true,
});

describe('given the update of an authorization client', () => {
  let mongoClient;
  let updateClientRequest;

  beforeAll(async () => {
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;
    await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(clientIdSame), mongoClient);
    updateClientRequest = await updateAuthorizationClientDocument(
      newUpdateAuthorizationClientRequest(clientIdSame),
      mongoClient,
    );
  });

  afterAll(async () => {
    await getAuthorizationCollection(mongoClient).deleteMany({});
    await mongoClient.close();
  });

  it('should exist in the db', async () => {
    const collection: Collection<AuthorizationDocument> = getAuthorizationCollection(mongoClient);
    const result: any = await collection.findOne({ _id: clientIdSame });
    expect(result).toMatchInlineSnapshot(`
      {
        "_id": "clientIdSame",
        "active": true,
        "clientName": "clientNameChanged",
        "clientSecretHashed": "clientSecretHashed",
        "isBootstrapAdmin": false,
        "roles": [
          "host",
        ],
      }
    `);
  });

  it('should return update success', async () => {
    expect(updateClientRequest).toMatchInlineSnapshot(`
      {
        "response": "UPDATE_SUCCESS",
      }
    `);
  });
});

describe('given the attempted update of an authorization client that does not exist', () => {
  let mongoClient;
  let updateClientRequest;

  beforeAll(async () => {
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;
    await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(clientIdSame), mongoClient);
    updateClientRequest = await updateAuthorizationClientDocument(
      newUpdateAuthorizationClientRequest(clientIdDifferent),
      mongoClient,
    );
  });

  afterAll(async () => {
    await getAuthorizationCollection(mongoClient).deleteMany({});
    await mongoClient.close();
  });

  it('should not exist in the db', async () => {
    const collection: Collection<AuthorizationDocument> = getAuthorizationCollection(mongoClient);
    const result: any = await collection.findOne({ _id: clientIdDifferent });
    expect(result).toBeNull();
  });

  it('should return update failed not exists', async () => {
    expect(updateClientRequest).toMatchInlineSnapshot(`
      {
        "response": "UPDATE_FAILED_NOT_EXISTS",
      }
    `);
  });
});

describe('given a closed MongoDB connection', () => {
  let mongoClient;
  let updateClientRequest;

  beforeAll(async () => {
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;

    mongoClient.close();
    updateClientRequest = await updateAuthorizationClientDocument(
      newUpdateAuthorizationClientRequest(clientIdSame),
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
    const result: any = await collection.findOne({ _id: clientIdSame });
    expect(result).toBeNull();
  });

  it('should return failure', async () => {
    expect(updateClientRequest).toMatchInlineSnapshot(`
      {
        "response": "UNKNOWN_FAILURE",
      }
    `);
  });
});
