// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { CreateAuthorizationClientRequest, CreateAuthorizationClientResult } from '@edfi/meadowlark-authz-server';
import * as utilities from '@edfi/meadowlark-utilities';
import type { PoolClient } from 'pg';
import { getSharedClient, resetSharedClient } from '../../../src/repository/Db';
import { createAuthorizationClientDocument } from '../../../src/repository/authorization/CreateAuthorizationClient';
import { deleteAllAuthorizations } from '../TestHelper';
import { getAuthorizationClientDocumentById } from '../../../src/repository/SqlHelper';
import * as SqlHelper from '../../../src/repository/SqlHelper';

const clientId = 'clientId';
jest.setTimeout(70000);
const newCreateAuthorizationClientRequest = (): CreateAuthorizationClientRequest => ({
  clientId,
  clientSecretHashed: 'clientSecretHashed',
  clientName: 'clientName',
  roles: ['vendor'],
  traceId: 'traceId',
  active: true,
});

describe('given the create of a new authorization client', () => {
  let client: PoolClient;
  let createClientRequest: CreateAuthorizationClientResult;

  beforeAll(async () => {
    client = await getSharedClient();
    createClientRequest = await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(), client);
  });

  afterAll(async () => {
    if (client) {
      await deleteAllAuthorizations(client);
      client.release();
      await resetSharedClient();
    }
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

  it('should return insert success', async () => {
    expect(createClientRequest).toMatchInlineSnapshot(`
    {
      "response": "CREATE_SUCCESS",
    }
    `);
  });
});

describe('given the create of a new authorization client with Postgresql SSI', () => {
  let client: PoolClient;
  let createClientRequest: CreateAuthorizationClientResult;
  const retryNumberOfTimes = 2;

  beforeEach(async () => {
    client = await getSharedClient();
  });

  afterEach(async () => {
    if (client) {
      await deleteAllAuthorizations(client);
      client.release();
      await resetSharedClient();
    }
  });
  it('should retry on error 40001', async () => {
    jest.spyOn(utilities.Config, 'get').mockImplementationOnce(() => retryNumberOfTimes);
    const mockError = {
      code: '40001',
      message: 'Could not serialize access due to read/write dependencies among transactions',
    };
    jest
      .spyOn(SqlHelper, 'insertOrUpdateAuthorization')
      .mockImplementationOnce(() => {
        throw mockError;
      })
      .mockImplementationOnce(() => {
        throw mockError;
      });
    createClientRequest = await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(), client);
    expect(createClientRequest.response).toBe('CREATE_SUCCESS');
  });

  it('should not retry on error not equal to 40001', async () => {
    jest.spyOn(utilities.Config, 'get').mockImplementationOnce(() => retryNumberOfTimes);
    const mockError = { code: '50000', message: 'Any exception different of SSI 40001' };
    // Mock selectReferences to throw an error
    jest.spyOn(SqlHelper, 'insertOrUpdateAuthorization').mockImplementation(() => {
      throw mockError;
    });
    createClientRequest = await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(), client);
    expect(createClientRequest.response).toBe('UNKNOWN_FAILURE');
  });

  it('should Throw Error When Retry Limit Exceeded', async () => {
    jest.spyOn(utilities.Config, 'get').mockImplementationOnce(() => retryNumberOfTimes);
    const mockError = {
      code: '40001',
      message: 'Could not serialize access due to read/write dependencies among transactions',
    };
    jest
      .spyOn(SqlHelper, 'insertOrUpdateAuthorization')
      .mockImplementationOnce(() => {
        throw mockError;
      })
      .mockImplementationOnce(() => {
        throw mockError;
      })
      .mockImplementationOnce(() => {
        throw mockError;
      });
    createClientRequest = await createAuthorizationClientDocument(newCreateAuthorizationClientRequest(), client);
    expect(createClientRequest.response).toBe('UNKNOWN_FAILURE');
  });
});
