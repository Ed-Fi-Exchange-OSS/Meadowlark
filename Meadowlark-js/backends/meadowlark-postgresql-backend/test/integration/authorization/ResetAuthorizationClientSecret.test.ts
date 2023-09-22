// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  CreateAuthorizationClientRequest,
  ResetAuthorizationClientSecretRequest,
  ResetAuthorizationClientSecretResult,
} from '@edfi/meadowlark-authz-server';
import { PoolClient } from 'pg';
import { getSharedClient, resetSharedClient } from '../../../src/repository/Db';
import { resetAuthorizationClientSecret } from '../../../src/repository/authorization/ResetAuthorizationClientSecret';
import { createAuthorizationClientDocument } from '../../../src/repository/authorization/CreateAuthorizationClient';
import { deleteAllAuthorizations } from '../TestHelper';
import { getAuthorizationClientDocumentById, getAuthorizationClientDocumentList } from '../../../src/repository/SqlHelper';

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
  let client: PoolClient;
  let resetClientSecretResponse: ResetAuthorizationClientSecretResult;

  beforeAll(async () => {
    client = await getSharedClient();
    await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(), client);
    resetClientSecretResponse = await resetAuthorizationClientSecret(newResetAuthorizationClientSecretRequest(), client);
  });

  afterAll(async () => {
    await deleteAllAuthorizations(client);
    client.release();
    await resetSharedClient();
  });

  it('should return a successful response', async () => {
    expect(resetClientSecretResponse).toMatchInlineSnapshot(`
          {
            "response": "RESET_SUCCESS",
          }
      `);
  });

  it('should exist in the db', async () => {
    const result: any = await getAuthorizationClientDocumentList(client);
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
  let client: PoolClient;
  let resetClientSecretResponse: ResetAuthorizationClientSecretResult;

  beforeAll(async () => {
    client = await getSharedClient();
    resetClientSecretResponse = await resetAuthorizationClientSecret(newResetAuthorizationClientSecretRequest(), client);
  });

  afterAll(async () => {
    await deleteAllAuthorizations(client);
    client.release();
    await resetSharedClient();
  });

  it('should not exist in the db', async () => {
    const result: any = await getAuthorizationClientDocumentById({ clientId: clientIdDifferent }, client);
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

describe('given a closed Postgresql connection', () => {
  let client: PoolClient;
  let resetClientSecretResponse: ResetAuthorizationClientSecretResult;

  beforeAll(async () => {
    client = await getSharedClient();
    client.release();
    await resetSharedClient();
    resetClientSecretResponse = await resetAuthorizationClientSecret(newResetAuthorizationClientSecretRequest(), client);
    client = await getSharedClient();
  });

  afterAll(async () => {
    await deleteAllAuthorizations(client);
    client.release();
    await resetSharedClient();
  });

  it('should not exist in the db', async () => {
    const result: any = await getAuthorizationClientDocumentById({ clientId: clientIdSame }, client);
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
