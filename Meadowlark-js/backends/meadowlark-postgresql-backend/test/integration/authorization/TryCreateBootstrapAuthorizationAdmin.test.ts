// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { CreateAuthorizationClientRequest, TryCreateBootstrapAuthorizationAdminResult } from '@edfi/meadowlark-authz-server';
import { PoolClient } from 'pg';
import { getSharedClient, resetSharedClient } from '../../../src/repository/Db';
import { tryCreateBootstrapAuthorizationAdminDocument } from '../../../src/repository/authorization/TryCreateBootstrapAuthorizationAdmin';
import { deleteAllAuthorizations } from '../TestHelper';
import { getAuthorizationClientDocumentById } from '../../../src/repository/SqlHelper';
import { NoAuthorizationDocument } from '../../../src/model/AuthorizationDocument';

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
  let client: PoolClient;
  let createClientRequest: TryCreateBootstrapAuthorizationAdminResult;

  beforeAll(async () => {
    client = await getSharedClient();
    createClientRequest = await tryCreateBootstrapAuthorizationAdminDocument(newCreateAuthorizationClientRequest(), client);
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

describe('given two attempts at the create of a bootstrap admin client', () => {
  let client: PoolClient;
  let createClientRequest1: TryCreateBootstrapAuthorizationAdminResult;
  let createClientRequest2: TryCreateBootstrapAuthorizationAdminResult;

  beforeAll(async () => {
    client = await getSharedClient();
    createClientRequest1 = await tryCreateBootstrapAuthorizationAdminDocument(newCreateAuthorizationClientRequest(), client);
    createClientRequest2 = await tryCreateBootstrapAuthorizationAdminDocument(
      { ...newCreateAuthorizationClientRequest(), clientId: 'clientId2' },
      client,
    );
  });

  afterAll(async () => {
    await deleteAllAuthorizations(client);
    client.release();
    await resetSharedClient();
  });

  it('should have client 1 in the db', async () => {
    const result: any = await getAuthorizationClientDocumentById(clientId, client);
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
    const result: any = await getAuthorizationClientDocumentById('clientId2', client);
    expect(result).toMatchObject(NoAuthorizationDocument);
  });

  it('should return already exists failure on second attempt', async () => {
    expect(createClientRequest2).toMatchInlineSnapshot(`
      {
        "response": "CREATE_FAILURE_ALREADY_EXISTS",
      }
    `);
  });
});
