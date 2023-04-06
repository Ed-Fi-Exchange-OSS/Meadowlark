// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, MongoClient } from 'mongodb';
import { CreateAuthorizationClientRequest, ResetAuthorizationClientSecretRequest } from '@edfi/meadowlark-authz-server';
import { getAuthorizationCollection, getNewClient } from '../../../src/repository/Db';
import { resetAuthorizationClientSecret } from '../../../src/repository/authorization/ResetAuthorizationClientSecret';
import { createAuthorizationClientDocument } from '../../../src/repository/authorization/CreateAuthorizationClient';
import { AuthorizationDocument } from '../../../src/model/AuthorizationDocument';
import { setupConfigForIntegration } from '../Config';

const clientId = 'clientId';
const clientIdDifferent = 'clientIdDifferent';
const clientIdSame = 'clientIdSame';

const newCreateAuthorizationClientRequest = (): CreateAuthorizationClientRequest => ({
  clientId,
  clientSecretHashed: 'clientSecretHashed',
  clientName: 'clientName',
  roles: ['vendor'],
  traceId: 'traceId',
  active: true,
});

const newResetAuthorizationClientSecretRequest = (): ResetAuthorizationClientSecretRequest => ({
  clientId,
  clientSecretHashed: 'updatedClientSecretHashed',
  traceId: 'traceId',
});

describe('given the get of an existing authorization client', () => {
  let mongoClient;
  let resetClientSecretResponse;

  beforeAll(async () => {
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;

    await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(), mongoClient);

    resetClientSecretResponse = await resetAuthorizationClientSecret(
      newResetAuthorizationClientSecretRequest(),
      mongoClient,
    );
  });

  afterAll(async () => {
    await getAuthorizationCollection(mongoClient).deleteMany({});
    await mongoClient.close();
  });

  it('should return a successful response', async () => {
    expect(resetClientSecretResponse).toMatchInlineSnapshot(`
          {
            "response": "RESET_SUCCESS",
          }
      `);
  });

  it('should exist in the db', async () => {
    const collection: Collection<AuthorizationDocument> = getAuthorizationCollection(mongoClient);
    const result: any = await collection.findOne({ _id: clientId });

    expect(result).toMatchInlineSnapshot(`
      {
        "_id": "clientId",
        "active": true,
        "clientName": "clientName",
        "clientSecretHashed": "updatedClientSecretHashed",
        "isBootstrapAdmin": false,
        "roles": [
          "vendor",
        ],
      }
    `);
  });
});

describe('given the attempted reset of a secret for an authorization client that does not exist', () => {
  let mongoClient;
  let resetClientSecretResponse;

  beforeAll(async () => {
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;

    resetClientSecretResponse = await resetAuthorizationClientSecret(
      newResetAuthorizationClientSecretRequest(),
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
    expect(resetClientSecretResponse).toMatchInlineSnapshot(`
      {
        "response": "RESET_FAILED_NOT_EXISTS",
      }
    `);
  });
});

describe('given a closed MongoDB connection', () => {
  let mongoClient;
  let resetClientSecretResponse;

  beforeAll(async () => {
    await setupConfigForIntegration();

    mongoClient = (await getNewClient()) as MongoClient;

    mongoClient.close();

    resetClientSecretResponse = await resetAuthorizationClientSecret(
      newResetAuthorizationClientSecretRequest(),
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
    expect(resetClientSecretResponse).toMatchInlineSnapshot(`
      {
        "response": "UNKNOWN_FAILURE",
      }
    `);
  });
});
