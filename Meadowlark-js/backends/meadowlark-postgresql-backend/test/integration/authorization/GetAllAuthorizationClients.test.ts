// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { CreateAuthorizationClientRequest, GetAllAuthorizationClientsResult } from '@edfi/meadowlark-authz-server';
import { PoolClient } from 'pg';
import { getSharedClient, resetSharedClient } from '../../../src/repository/Db';
import { createAuthorizationClientDocument } from '../../../src/repository/authorization/CreateAuthorizationClient';
import { getAllAuthorizationClientDocuments } from '../../../src/repository/authorization/GetAllAuthorizationClients';
import { deleteAllAuthorizations } from '../TestHelper';

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
    let client: PoolClient;
    let response: GetAllAuthorizationClientsResult;

    beforeAll(async () => {
      client = await getSharedClient();
      // create the client
      await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(), client);
      response = await getAllAuthorizationClientDocuments(TRACE_ID, client);
    });

    afterAll(async () => {
      if (client) {
        await deleteAllAuthorizations(client);
        client.release();
        await resetSharedClient();
      }
    });

    it('should return get success', async () => {
      expect(response).toMatchInlineSnapshot(`
        {
          "clients": [
            {
              "active": true,
              "clientId": "clientId",
              "clientName": "clientName",
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
    let client: PoolClient;
    let response: GetAllAuthorizationClientsResult;

    beforeAll(async () => {
      client = await getSharedClient();
      response = await getAllAuthorizationClientDocuments(TRACE_ID, client);
    });

    afterAll(async () => {
      if (client) {
        await deleteAllAuthorizations(client);
        client.release();
        await resetSharedClient();
      }
    });

    it('should return not exists', async () => {
      expect(response).toMatchInlineSnapshot(`
        {
          "response": "GET_FAILURE_NOT_EXISTS",
        }
      `);
    });
  });
});
