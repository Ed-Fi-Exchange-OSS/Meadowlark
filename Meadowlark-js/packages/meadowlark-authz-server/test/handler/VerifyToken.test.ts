// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { verifyToken } from '../../src/handler/VerifyToken';
import * as AuthorizationPluginLoader from '../../src/plugin/AuthorizationPluginLoader';
import { AuthorizationRequest, newAuthorizationRequest } from '../../src/handler/AuthorizationRequest';
import { AuthorizationResponse } from '../../src/handler/AuthorizationResponse';
import { NoAuthorizationStorePlugin } from '../../src/plugin/NoAuthorizationStorePlugin';
import { createAuthorizationHeader, createTokenString, ONE_HOUR_AGO } from '../security/TestHelper';
import { TOKEN_ISSUER } from '../../src/security/TokenIssuer';

process.env.OAUTH_SIGNING_KEY =
  'v/AbsYGRvIfCf1bxufA6+Ras5NR+kIroLUg5RKYMjmqvNa1fVanmPBXKFH+MD1TPHpSgna0g+6oRnmRGUme6vJ7x91OA7Lp1hWzr6NnpdLYA9BmDHWjkRFvlx9bVmP+GTave2E4RAYa5b/qlvXOVnwaqEWzHxefqzkd1F1mQ6dVNFWYdiOmgw8ofQ87Xi1W0DkToRNS/Roc4rxby/BZwHUj7Y4tYdMpkWDMrZK6Vwat1KuPyiqsaBQYa9Xd0pxKqUOrAp8a+BFwiPfxf4nyVdOSAd77A/wuKIJaERNY5xJXUHwNgEOMf+Lg4032u4PnsnH7aJb2F4z8AhHldM6w5jw==';

const authorizationRequest: AuthorizationRequest = {
  ...newAuthorizationRequest(),
  path: '/oauth/verify',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    Authorization: createAuthorizationHeader('clientId', ['vendor']),
  },
};

describe('given bearer token is invalid', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    // Act
    response = await verifyToken({
      ...authorizationRequest,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: 'Bearer invalidToken',
      },
      body: 'token=123',
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 401', () => {
    expect(response.statusCode).toEqual(401);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(
      `"{"statusCode":401,"body":"{ \\"error\\": \\"invalid_token\\", \\"error_description\\": \\"Invalid authorization token\\" }","headers":{"WWW-Authenticate":"Bearer"}}"`,
    );
  });
});

describe('given content type is not x-www-form-urlencoded', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    // Act
    response = await verifyToken({
      ...authorizationRequest,
      headers: {
        'content-type': 'application/json',
        Authorization: createAuthorizationHeader('clientId', ['vendor']),
      },
      body: '{ "token": "123" }',
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`"{"error":"Requires application/x-www-form-urlencoded content type"}"`);
  });
});

describe('given content type is x-www-form-urlencoded but data is not', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    // Act
    response = await verifyToken({
      ...authorizationRequest,
      body: 'not form encoded',
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(
      `"{"error":"[{\\"message\\":\\"{requestBody} must have required property 'token'\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"required\\"}},{\\"message\\":\\"'not form encoded' property is not expected to be here\\",\\"suggestion\\":\\"Did you mean property 'token'?\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"additionalProperties\\"}}]"}"`,
    );
  });
});

describe('given request body is valid x-www-form-urlencoded but without expected fields', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    // Act
    response = await verifyToken({
      ...authorizationRequest,
      body: 'not_token=123',
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(
      `"{"error":"[{\\"message\\":\\"{requestBody} must have required property 'token'\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"required\\"}},{\\"message\\":\\"'not_token' property is not expected to be here\\",\\"suggestion\\":\\"Did you mean property 'token'?\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"additionalProperties\\"}}]"}"`,
    );
  });
});

describe('given request body provided invalid token for introspection', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    // Act
    response = await verifyToken({
      ...authorizationRequest,
      body: 'token=invalidToken',
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`"{"error":"Invalid token provided for introspection"}"`);
  });
});

describe('given vendor role provided token for introspection but client ids do not match', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['vendor'],
          clientSecretHashed: 'hash',
        }),
    });

    // Act
    response = await verifyToken({
      ...authorizationRequest,
      body: `token=${createTokenString('differentClientId', ['vendor'])}`,
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 401', () => {
    expect(response.statusCode).toEqual(401);
  });

  it('returns empty body', () => {
    expect(response.body).toBe('');
  });
});

describe('given vendor role provided token for introspection and client ids match', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['vendor'],
          clientSecretHashed: 'hash',
        }),
    });

    // Act
    response = await verifyToken({
      ...authorizationRequest,
      body: `token=${createTokenString('clientId', ['vendor'])}`,
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns response', () => {
    const parsedResponseBody = JSON.parse(response.body);
    expect(parsedResponseBody.active).toBe(true);
    expect(parsedResponseBody.aud).toBe(TOKEN_ISSUER);
    expect(parsedResponseBody.client_id).toBe('clientId');
    expect(parsedResponseBody.iss).toBe(TOKEN_ISSUER);
    expect(parsedResponseBody.roles).toHaveLength(1);
    expect(parsedResponseBody.roles[0]).toBe('vendor');
  });
});

describe('given admin role provided token for introspection and client ids do not match', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['vendor'],
          clientSecretHashed: 'hash',
        }),
    });

    // Act
    response = await verifyToken({
      ...authorizationRequest,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: createAuthorizationHeader('adminClientId', ['admin']),
      },
      body: `token=${createTokenString('clientId', ['vendor'])}`,
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns response', () => {
    const parsedResponseBody = JSON.parse(response.body);
    expect(parsedResponseBody.active).toBe(true);
    expect(parsedResponseBody.aud).toBe(TOKEN_ISSUER);
    expect(parsedResponseBody.client_id).toBe('clientId');
    expect(parsedResponseBody.iss).toBe(TOKEN_ISSUER);
    expect(parsedResponseBody.roles).toHaveLength(1);
    expect(parsedResponseBody.roles[0]).toBe('vendor');
  });
});

describe('given admin role provided expired token for introspection', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['vendor'],
          clientSecretHashed: 'hash',
        }),
    });

    // Act
    response = await verifyToken({
      ...authorizationRequest,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: createAuthorizationHeader('adminClientId', ['admin']),
      },
      body: `token=${createTokenString('clientId', ['vendor'], ONE_HOUR_AGO)}`,
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns response', () => {
    const parsedResponseBody = JSON.parse(response.body);
    expect(parsedResponseBody.active).toBe(false);
    expect(parsedResponseBody.aud).toBeUndefined();
    expect(parsedResponseBody.client_id).toBeUndefined();
    expect(parsedResponseBody.iss).toBeUndefined();
    expect(parsedResponseBody.roles).toBeUndefined();
  });
});
