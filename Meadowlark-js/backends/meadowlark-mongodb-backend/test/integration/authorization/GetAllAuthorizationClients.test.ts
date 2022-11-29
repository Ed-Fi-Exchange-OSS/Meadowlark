// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { CreateAuthorizationClientRequest } from '@edfi/meadowlark-authz-server';
import { MongoClient } from 'mongodb';
import { getAuthorizationCollection, getNewClient } from '../../../src/repository/Db';
import { createAuthorizationClientDocument } from '../../../src/repository/authorization/CreateAuthorizationClient';
import { getAllAuthorizationClientDocuments } from '../../../src/repository/authorization/GetAllAuthorizationClients';

jest.setTimeout(40000);

const clientId = 'clientId';

const TRACE_ID = 'traceId';
const newCreateAuthorizationClientRequest = (): CreateAuthorizationClientRequest => ({
  clientId,
  clientSecretHashed: 'clientSecretHashed',
  clientName: 'clientName',
  roles: ['vendor'],
  traceId: TRACE_ID,
  active: true,
});

describe('when fetching authorization clients', () => {
  describe('given there is one authorization client', () => {
    let mongoClient;
    let response;

    beforeAll(async () => {
      mongoClient = (await getNewClient()) as MongoClient;
      // create the client
      await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(), mongoClient);

      response = await getAllAuthorizationClientDocuments(TRACE_ID, mongoClient);
    });

    afterAll(async () => {
      await getAuthorizationCollection(mongoClient).deleteMany({});
      await mongoClient.close();
    });

    it('should return get success', async () => {
      expect(response).toMatchInlineSnapshot(`
        {
          "clients": [
            {
              "_id": "clientId",
              "active": true,
              "clientName": "clientName",
              "clientSecretHashed": "clientSecretHashed",
              "isBootstrapAdmin": false,
              "roles": [
                "vendor",
              ],
            },
          ],
          "response": "GET_SUCCESS",
        }
      `);
    });
  });

  describe('given there are no authorization clients', () => {
    let mongoClient;
    let response;

    beforeAll(async () => {
      mongoClient = (await getNewClient()) as MongoClient;
      response = await getAllAuthorizationClientDocuments(TRACE_ID, mongoClient);
    });

    afterAll(async () => {
      await getAuthorizationCollection(mongoClient).deleteMany({});
      await mongoClient.close();
    });

    it('should return success with an empty array', async () => {
      expect(response).toMatchInlineSnapshot(`
        {
          "clients": [],
          "response": "GET_SUCCESS",
        }
      `);
    });
  });

  describe('given a closed MongoDB connection', () => {
    let mongoClient;
    let response;

    beforeAll(async () => {
      mongoClient = (await getNewClient()) as MongoClient;

      mongoClient.close();

      response = await getAllAuthorizationClientDocuments(TRACE_ID, mongoClient);
      mongoClient = (await getNewClient()) as MongoClient;
    });

    afterAll(async () => {
      await getAuthorizationCollection(mongoClient).deleteMany({});
      await mongoClient.close();
    });

    it('should return not found', async () => {
      expect(response).toMatchInlineSnapshot(`
        {
          "clients": [],
          "response": "GET_SUCCESS",
        }
      `);
    });
  });
});
