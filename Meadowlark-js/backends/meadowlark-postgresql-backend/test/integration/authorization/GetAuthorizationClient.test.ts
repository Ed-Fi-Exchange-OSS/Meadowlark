// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  CreateAuthorizationClientRequest,
  GetAuthorizationClientRequest,
  GetAuthorizationClientResult,
} from '@edfi/meadowlark-authz-server';
import { PoolClient } from 'pg';
import { getSharedClient, resetSharedClient } from '../../../src/repository/Db';
import { createAuthorizationClientDocument } from '../../../src/repository/authorization/CreateAuthorizationClient';
import { getAuthorizationClientDocument } from '../../../src/repository/authorization/GetAuthorizationClient';
import { getAuthorizationClientDocumentById } from '../../../src/repository/SqlHelper';
import { deleteAllAuthorizations } from '../TestHelper';
import { NoAuthorizationDocument } from '../../../src/model/AuthorizationDocument';

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
  let client: PoolClient;
  let getClientRequest: GetAuthorizationClientResult;

  beforeAll(async () => {
    client = await getSharedClient();
    // create the client
    await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(), client);
    getClientRequest = await getAuthorizationClientDocument(newGetAuthorizationClientRequest(), client);
  });

  afterAll(async () => {
    await deleteAllAuthorizations(client);
    client.release();
    await resetSharedClient();
  });

  it('should exist in the db', async () => {
    const result: any = await getAuthorizationClientDocumentById(clientId, client);
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
  let client: PoolClient;
  let getClientRequest;

  beforeAll(async () => {
    client = await getSharedClient();
    getClientRequest = await getAuthorizationClientDocument(newGetAuthorizationClientRequest(), client);
  });

  afterAll(async () => {
    await deleteAllAuthorizations(client);
    client.release();
    await resetSharedClient();
  });

  it('should not exist in the db', async () => {
    const result: any = await getAuthorizationClientDocumentById(clientId, client);
    expect(result).toMatchObject(NoAuthorizationDocument);
  });

  it('should return get not exists', async () => {
    expect(getClientRequest).toMatchInlineSnapshot(`
    {
      "response": "GET_FAILURE_NOT_EXISTS",
    }
    `);
  });
});
