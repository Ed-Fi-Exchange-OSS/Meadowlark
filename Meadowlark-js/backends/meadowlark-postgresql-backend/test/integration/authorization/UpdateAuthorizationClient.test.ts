// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  CreateAuthorizationClientRequest,
  UpdateAuthorizationClientRequest,
  UpdateAuthorizationClientResult,
} from '@edfi/meadowlark-authz-server';
import { PoolClient } from 'pg';
import { getSharedClient, resetSharedClient } from '../../../src/repository/Db';
import { updateAuthorizationClientDocument } from '../../../src/repository/authorization/UpdateAuthorizationClient';
import { createAuthorizationClientDocument } from '../../../src/repository/authorization/CreateAuthorizationClient';
import { deleteAllAuthorizations } from '../TestHelper';
import { getAuthorizationClientDocumentById } from '../../../src/repository/SqlHelper';
import { AuthorizationDocument, NoAuthorizationDocument } from '../../../src/model/AuthorizationDocument';

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
  let client: PoolClient;
  let updateClientRequest: UpdateAuthorizationClientResult;

  beforeAll(async () => {
    client = await getSharedClient();
    await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(clientIdSame), client);
    updateClientRequest = await updateAuthorizationClientDocument(newUpdateAuthorizationClientRequest(clientIdSame), client);
  });

  afterAll(async () => {
    await deleteAllAuthorizations(client);
    client.release();
    await resetSharedClient();
  });

  it('should exist in the db', async () => {
    const result: any = await getAuthorizationClientDocumentById(clientIdSame, client);
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
  let client: PoolClient;
  let updateClientRequest: UpdateAuthorizationClientResult;

  beforeAll(async () => {
    client = await getSharedClient();
    await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(clientIdSame), client);
    updateClientRequest = await updateAuthorizationClientDocument(
      newUpdateAuthorizationClientRequest(clientIdDifferent),
      client,
    );
  });

  afterAll(async () => {
    await deleteAllAuthorizations(client);
    client.release();
    await resetSharedClient();
  });

  it('should not exist in the db', async () => {
    const result: AuthorizationDocument = await getAuthorizationClientDocumentById(clientIdDifferent, client);
    expect(result).toMatchObject(NoAuthorizationDocument);
  });

  it('should return update failed not exists', async () => {
    expect(updateClientRequest).toMatchInlineSnapshot(`
      {
        "response": "UPDATE_FAILED_NOT_EXISTS",
      }
    `);
  });
});
