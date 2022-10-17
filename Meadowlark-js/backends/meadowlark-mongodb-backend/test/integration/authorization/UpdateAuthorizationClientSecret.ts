// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, MongoClient } from 'mongodb';
import { CreateAuthorizationClientRequest, UpdateAuthorizationClientSecretRequest } from '@edfi/meadowlark-authz-server';
import { getAuthorizationCollection, getNewClient } from '../../../src/repository/Db';
import { updateAuthorizationClientSecret } from '../../../src/repository/authorization/UpdateAuthorizationClientSecret';
import { createAuthorizationClientDocument } from '../../../src/repository/authorization/CreateAuthorizationClient';
import { AuthorizationDocument } from '../../../src/model/AuthorizationDocument';

jest.setTimeout(40000);

const clientId = 'clientId';

const newCreateAuthorizationClientRequest = (): CreateAuthorizationClientRequest => ({
  clientId,
  clientSecretHashed: 'clientSecretHashed',
  clientName: 'clientName',
  roles: ['vendor'],
  traceId: 'traceId',
});

const newUpdateAuthorizationClientSecretRequest = (): UpdateAuthorizationClientSecretRequest => ({
  clientId,
  clientSecretHashed: 'updatedClientSecretHashed',
  traceId: 'traceId',
});

describe('given the get of an existing authorization client', () => {
  let mongoClient;
  let createClientRequest;
  let updateClientSecretResponse;

  beforeAll(async () => {
    mongoClient = (await getNewClient()) as MongoClient;

    createClientRequest = await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(), mongoClient);

    updateClientSecretResponse = await updateAuthorizationClientSecret(newCreateAuthorizationClientRequest(), mongoClient);
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
      "clientName": "clientName",
      "clientSecretHashed": "updatedClientSecretHashed",
      "roles": [
        "vendor",
      ],
    }
  `);
  });
});
