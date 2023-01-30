// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config } from '@edfi/meadowlark-utilities';
import { verifyToken } from '../../src/handler/VerifyToken';
import * as AuthorizationPluginLoader from '../../src/plugin/AuthorizationPluginLoader';
import { AuthorizationRequest, newAuthorizationRequest } from '../../src/handler/AuthorizationRequest';
import { AuthorizationResponse } from '../../src/handler/AuthorizationResponse';
import { NoAuthorizationStorePlugin } from '../../src/plugin/NoAuthorizationStorePlugin';
import { createAuthorizationHeader, createTokenString } from '../security/TestHelper';

const setupMockConfiguration = () => {
  jest.spyOn(Config, 'get').mockImplementation((key: Config.ConfigKeys) => {
    switch (key) {
      case 'OAUTH_SIGNING_KEY':
        return 'v/AbsYGRvIfCf1bxufA6+Ras5NR+kIroLUg5RKYMjmqvNa1fVanmPBXKFH+MD1TPHpSgna0g+6oRnmRGUme6vJ7x91OA7Lp1hWzr6NnpdLYA9BmDHWjkRFvlx9bVmP+GTave2E4RAYa5b/qlvXOVnwaqEWzHxefqzkd1F1mQ6dVNFWYdiOmgw8ofQ87Xi1W0DkToRNS/Roc4rxby/BZwHUj7Y4tYdMpkWDMrZK6Vwat1KuPyiqsaBQYa9Xd0pxKqUOrAp8a+BFwiPfxf4nyVdOSAd77A/wuKIJaERNY5xJXUHwNgEOMf+Lg4032u4PnsnH7aJb2F4z8AhHldM6w5jw==';
      case 'OAUTH_TOKEN_ISSUER':
        return 'edfi-meadowlark-issuer';
      case 'OAUTH_TOKEN_AUDIENCE':
        return 'edfi-meadowlark-audience';
      default:
        throw new Error(`Key '${key}' not configured`);
    }
  });
};

const createAuthorizationRequest = (): AuthorizationRequest => ({
  ...newAuthorizationRequest(),
  path: '/oauth/verify',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    Authorization: createAuthorizationHeader('clientId', ['vendor']),
  },
});

describe('given bearer token is invalid', () => {
  let response: AuthorizationResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    // Act
    response = await verifyToken({
      ...createAuthorizationRequest(),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: 'Bearer invalidToken',
      },
      body: 'token=123',
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns status 401', () => {
    expect(response.statusCode).toEqual(401);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": "invalid_token",
        "error_description": "Invalid authorization token",
      }
    `);
  });
});

describe('given content type is not x-www-form-urlencoded', () => {
  let response: AuthorizationResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    // Act
    response = await verifyToken({
      ...createAuthorizationRequest(),
      headers: {
        'content-type': 'application/json',
        Authorization: createAuthorizationHeader('clientId', ['vendor']),
      },
      body: '{ "token": "123" }',
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": "Requires application/x-www-form-urlencoded content type",
      }
    `);
  });
});

describe('given content type is x-www-form-urlencoded but data is not', () => {
  let response: AuthorizationResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    // Act
    response = await verifyToken({
      ...createAuthorizationRequest(),
      body: 'not form encoded',
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": [
          {
            "context": {
              "errorType": "required",
            },
            "message": "{requestBody} must have required property 'token'",
            "path": "{requestBody}",
          },
          {
            "context": {
              "errorType": "additionalProperties",
            },
            "message": "'not form encoded' property is not expected to be here",
            "path": "{requestBody}",
            "suggestion": "Did you mean property 'token'?",
          },
        ],
      }
    `);
  });
});

describe('given request body is valid x-www-form-urlencoded but without expected fields', () => {
  let response: AuthorizationResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    // Act
    response = await verifyToken({
      ...createAuthorizationRequest(),
      body: 'not_token=123',
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": [
          {
            "context": {
              "errorType": "required",
            },
            "message": "{requestBody} must have required property 'token'",
            "path": "{requestBody}",
          },
          {
            "context": {
              "errorType": "additionalProperties",
            },
            "message": "'not_token' property is not expected to be here",
            "path": "{requestBody}",
            "suggestion": "Did you mean property 'token'?",
          },
        ],
      }
    `);
  });
});

describe('given request body provided invalid token for introspection', () => {
  let response: AuthorizationResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    // Act
    response = await verifyToken({
      ...createAuthorizationRequest(),
      body: 'token=invalidToken',
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": "Invalid token provided for introspection",
      }
    `);
  });
});

describe('given vendor role provided token for introspection but client ids do not match', () => {
  let response: AuthorizationResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['vendor'],
          clientSecretHashed: 'hash',
          active: true,
        }),
    });

    // Act
    response = await verifyToken({
      ...createAuthorizationRequest(),
      body: `token=${createTokenString('differentClientId', ['vendor'])}`,
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns status 401', () => {
    expect(response.statusCode).toEqual(401);
  });

  it('returns empty body', () => {
    expect(response.body).toBeUndefined();
  });
});

describe('given vendor role provided token for introspection and client ids match', () => {
  let response: AuthorizationResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['vendor'],
          clientSecretHashed: 'hash',
          active: true,
        }),
    });

    // Act
    response = await verifyToken({
      ...createAuthorizationRequest(),
      body: `token=${createTokenString('clientId', ['vendor'], 12345000, 'i', 'a', 67890)}`,
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns response', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "active": false,
        "aud": "a",
        "client_id": "clientId",
        "exp": 12345,
        "iat": 67890,
        "iss": "i",
        "roles": [
          "vendor",
        ],
        "sub": "",
      }
    `);
  });
});

describe('given admin role provided a token from a different client for introspection', () => {
  let response: AuthorizationResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['vendor'],
          clientSecretHashed: 'hash',
          active: true,
        }),
    });

    // Act
    response = await verifyToken({
      ...createAuthorizationRequest(),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: createAuthorizationHeader('adminClientId', ['admin']),
      },
      body: `token=${createTokenString('clientId', ['vendor'], 1671118426, 'a', 'i', 1671114826)}`,
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns response', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "active": false,
        "aud": "i",
        "client_id": "clientId",
        "exp": 1671118,
        "iat": 1671114826,
        "iss": "a",
        "roles": [
          "vendor",
        ],
        "sub": "",
      }
    `);
  });
});

describe('given admin role provided expired token for introspection', () => {
  let response: AuthorizationResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['vendor'],
          clientSecretHashed: 'hash',
          active: true,
        }),
    });

    // Act
    response = await verifyToken({
      ...createAuthorizationRequest(),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: createAuthorizationHeader('adminClientId', ['admin']),
      },
      body: `token=${createTokenString('clientId', ['vendor'], 1671111226, 'i', 'a', 1671114826)}`,
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns response', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "active": false,
        "aud": "a",
        "client_id": "clientId",
        "exp": 1671111,
        "iat": 1671114826,
        "iss": "i",
        "roles": [
          "vendor",
        ],
        "sub": "",
      }
    `);
  });
});
