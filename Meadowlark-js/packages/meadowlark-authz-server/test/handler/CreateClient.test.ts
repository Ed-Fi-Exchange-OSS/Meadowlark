// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import crypto from 'node:crypto';
import { createClient } from '../../src/handler/CreateClient';
import { CreateAuthorizationClientResult } from '../../src/message/CreateAuthorizationClientResult';
import * as JwtAction from '../../src/security/JwtAction';
import * as AuthorizationPluginLoader from '../../src/plugin/AuthorizationPluginLoader';
import { AuthorizationRequest, newAuthorizationRequest } from '../../src/handler/AuthorizationRequest';
import { AuthorizationResponse } from '../../src/handler/AuthorizationResponse';
import { NoAuthorizationStorePlugin } from '../../src/plugin/NoAuthorizationStorePlugin';
import { newJwtStatus } from '../../src/security/JwtStatus';
import { TryCreateBootstrapAuthorizationAdminResult } from '../../src/message/TryCreateBootstrapAuthorizationAdminResult';
import { ClientId } from '../../src/Utility';

const authorizationRequest: AuthorizationRequest = {
  ...newAuthorizationRequest(),
  path: '/oauth/clients',
  body: `{
    "clientName": "Hometown SIS",
    "roles": [
      "vendor",
      "assessment"
    ]
  }`,
  headers: { Authorization: 'abcdef' },
};

describe('given valid admin user but authorization store is going to fail', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      createAuthorizationClient: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isValid: true,
      roles: ['admin'],
    });

    // Act
    response = await createClient(authorizationRequest);
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
    mockMeadowlarkCore.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('does not return a message body', () => {
    expect(response.body).toBeUndefined();
  });
});

describe('given authorization store succeeds on create', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      createAuthorizationClient: async () =>
        Promise.resolve({
          response: 'CREATE_SUCCESS',
        } as CreateAuthorizationClientResult),
    });

    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isValid: true,
      roles: ['admin'],
    });

    jest.spyOn(ClientId, 'new').mockReturnValue('ea530639-6cf1-40a5-b959-58fce20018c4');

    // Weird mechanism for dealing with the overloaded randomBytes() function; otherwise, Jest ends up spying on the other
    // signature instead of the desired one.
    type cryptoOverload = {
      randomBytes(size: number): Buffer;
    };

    jest
      .spyOn(crypto as cryptoOverload, 'randomBytes')
      .mockReturnValue(Buffer.from('48a8caf085d98a074f9e2cda364e08adfe2c37bf19217f3eaa993254c7f9940b', 'hex'));

    // Act
    response = await createClient(authorizationRequest);
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
    mockMeadowlarkCore.mockRestore();
  });

  it('returns status 201', () => {
    expect(response.statusCode).toEqual(201);
  });

  it('returns a message containing new client information', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "clientName": "Hometown SIS",
        "client_id": "ea530639-6cf1-40a5-b959-58fce20018c4",
        "client_secret": "48a8caf085d98a074f9e2cda364e08adfe2c37bf19217f3eaa993254c7f9940b",
        "roles": [
          "vendor",
          "assessment",
        ],
      }
    `);
  });

  it('it returns location header', () => {
    expect((response.headers as any).Location.startsWith('/oauth/clients/')).toBe(true);
  });
});

describe('given missing authorization token', () => {
  let response: AuthorizationResponse;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isMissing: true,
    });

    // Act
    response = await createClient(authorizationRequest);
  });

  afterAll(() => {
    mockMeadowlarkCore.mockRestore();
  });

  it('returns error response', () => {
    expect(response).toMatchInlineSnapshot(`
      {
        "body": {
          "error": "invalid_client",
          "error_description": "Authorization token not provided",
        },
        "headers": {
          "WWW-Authenticate": "Bearer",
        },
        "statusCode": 401,
      }
    `);
  });
});

describe('given expired authorization token', () => {
  let response: AuthorizationResponse;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isMissing: false,
      isExpired: true,
    });

    // Act
    response = await createClient(authorizationRequest);
  });

  afterAll(() => {
    mockMeadowlarkCore.mockRestore();
  });

  it('returns error response', () => {
    expect(response).toMatchInlineSnapshot(`
      {
        "body": {
          "error": "invalid_token",
          "error_description": "Token is expired",
        },
        "headers": {
          "WWW-Authenticate": "Bearer",
        },
        "statusCode": 401,
      }
    `);
  });
});

describe('given non-admin authorization token', () => {
  let response: AuthorizationResponse;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isMissing: false,
      isExpired: false,
      isValid: true,
      roles: ['vendor'],
    });

    // Act
    response = await createClient(authorizationRequest);
  });

  afterAll(() => {
    mockMeadowlarkCore.mockRestore();
  });

  it('returns error response', () => {
    expect(response.body).toBeUndefined();
  });
});

describe('given invalid authorization token', () => {
  let response: AuthorizationResponse;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isMissing: false,
      isExpired: false,
      roles: ['admin'],
      isValid: false,
    });

    // Act
    response = await createClient(authorizationRequest);
  });

  afterAll(() => {
    mockMeadowlarkCore.mockRestore();
  });

  it('returns error response', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": "invalid_token",
        "error_description": "Invalid authorization token",
      }
    `);
  });
});

describe('given create has missing body', () => {
  const missingBodyRequest: AuthorizationRequest = {
    ...newAuthorizationRequest(),
    path: '/oauth/clients',
  };

  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      createAuthorizationClient: async () =>
        Promise.resolve({
          response: 'CREATE_SUCCESS',
        } as CreateAuthorizationClientResult),
    });

    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isValid: true,
      roles: ['admin'],
    });

    // Act
    response = await createClient(missingBodyRequest);
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
    mockMeadowlarkCore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error response', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": "Missing body",
      }
    `);
  });
});

describe('given create has malformed json body', () => {
  const malformedBodyRequest: AuthorizationRequest = {
    ...newAuthorizationRequest(),
    path: '/oauth/clients',
    body: '{ bad',
  };

  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      createAuthorizationClient: async () =>
        Promise.resolve({
          response: 'CREATE_SUCCESS',
        } as CreateAuthorizationClientResult),
    });

    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isValid: true,
      roles: ['admin'],
    });

    // Act
    response = await createClient(malformedBodyRequest);
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
    mockMeadowlarkCore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error response', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": "Malformed body: Unexpected token b in JSON at position 2",
      }
    `);
  });
});

describe('given create has well-formed but invalid json body', () => {
  const invalidBodyRequest: AuthorizationRequest = {
    ...newAuthorizationRequest(),
    path: '/oauth/clients',
    body: '{}',
  };

  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      createAuthorizationClient: async () =>
        Promise.resolve({
          response: 'CREATE_SUCCESS',
        } as CreateAuthorizationClientResult),
    });

    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isValid: true,
      roles: ['admin'],
    });

    // Act
    response = await createClient(invalidBodyRequest);
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
    mockMeadowlarkCore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error response', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": [
          {
            "context": {
              "errorType": "required",
            },
            "message": "{requestBody} must have required property 'clientName'",
            "path": "{requestBody}",
          },
          {
            "context": {
              "errorType": "required",
            },
            "message": "{requestBody} must have required property 'roles'",
            "path": "{requestBody}",
          },
        ],
      }
    `);
  });
});

describe('given create throws internal error', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockImplementation(() => {
      throw new Error();
    });

    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isValid: true,
      roles: ['admin'],
    });

    // Act
    response = await createClient(authorizationRequest);
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
    mockMeadowlarkCore.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('does not return a message body', () => {
    expect(response.body).toBeUndefined();
  });
});

describe('given authorization store success on try create bootstrap admin', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      tryCreateBootstrapAuthorizationAdmin: async () =>
        Promise.resolve({
          response: 'CREATE_SUCCESS',
        } as TryCreateBootstrapAuthorizationAdminResult),
    });

    jest.spyOn(ClientId, 'new').mockReturnValue('68d78668-edc1-4c80-818c-5c0b5e15125a');

    // Weird mechanism for dealing with the overloaded randomBytes() function; otherwise, Jest ends up spying on the other
    // signature instead of the desired one.
    type cryptoOverload = {
      randomBytes(size: number): Buffer;
    };

    jest
      .spyOn(crypto as cryptoOverload, 'randomBytes')
      .mockReturnValue(Buffer.from('c58370c8570215a8923a63704aeb2df4fe1029f251198edc8fe16f27bb20943a', 'hex'));

    // Act
    response = await createClient({
      ...authorizationRequest,
      headers: {},
      body: `{
        "clientName": "Admin Bootstrap",
        "roles": ["admin"]
      }`,
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 201', () => {
    expect(response.statusCode).toEqual(201);
  });

  it('returns a response describing the created client', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "clientName": "Admin Bootstrap",
        "client_id": "68d78668-edc1-4c80-818c-5c0b5e15125a",
        "client_secret": "c58370c8570215a8923a63704aeb2df4fe1029f251198edc8fe16f27bb20943a",
        "roles": [
          "admin",
        ],
      }
    `);
  });

  it('it returns location header', () => {
    expect((response.headers as any).Location.startsWith('/oauth/clients/')).toBe(true);
  });
});

describe('given try create bootstrap admin for non-admin role', () => {
  let response: AuthorizationResponse;

  beforeAll(async () => {
    // Act
    response = await createClient({
      ...authorizationRequest,
      headers: {},
      body: `{
        "clientName": "Admin Bootstrap",
        "roles": ["vendor"]
      }`,
    });
  });

  it('returns status 401', () => {
    expect(response.statusCode).toEqual(401);
  });

  it('returns an error message', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": "invalid_client",
        "error_description": "Authorization token not provided",
      }
    `);
  });
});

describe('given already exists on try create bootstrap admin', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      tryCreateBootstrapAuthorizationAdmin: async () =>
        Promise.resolve({
          response: 'CREATE_FAILURE_ALREADY_EXISTS',
        } as TryCreateBootstrapAuthorizationAdminResult),
    });

    // Act
    response = await createClient({
      ...authorizationRequest,
      headers: {},
      body: `{
        "clientName": "Admin Bootstrap",
        "roles": ["admin"]
      }`,
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 401', () => {
    expect(response.statusCode).toEqual(401);
  });

  it('returns an error message', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": "invalid_client",
        "error_description": "Authorization token not provided",
      }
    `);
  });
});
