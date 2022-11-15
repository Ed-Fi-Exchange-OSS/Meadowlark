// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { requestToken } from '../../src/handler/RequestToken';
import * as AuthorizationPluginLoader from '../../src/plugin/AuthorizationPluginLoader';
import { AuthorizationRequest, newAuthorizationRequest } from '../../src/handler/AuthorizationRequest';
import { AuthorizationResponse } from '../../src/handler/AuthorizationResponse';
import { NoAuthorizationStorePlugin } from '../../src/plugin/NoAuthorizationStorePlugin';
import { admin1 } from '../../src/security/HardcodedCredential';
import { hashClientSecretHexString } from '../../src/security/HashClientSecret';

process.env.SIGNING_KEY =
  'v/AbsYGRvIfCf1bxufA6+Ras5NR+kIroLUg5RKYMjmqvNa1fVanmPBXKFH+MD1TPHpSgna0g+6oRnmRGUme6vJ7x91OA7Lp1hWzr6NnpdLYA9BmDHWjkRFvlx9bVmP+GTave2E4RAYa5b/qlvXOVnwaqEWzHxefqzkd1F1mQ6dVNFWYdiOmgw8ofQ87Xi1W0DkToRNS/Roc4rxby/BZwHUj7Y4tYdMpkWDMrZK6Vwat1KuPyiqsaBQYa9Xd0pxKqUOrAp8a+BFwiPfxf4nyVdOSAd77A/wuKIJaERNY5xJXUHwNgEOMf+Lg4032u4PnsnH7aJb2F4z8AhHldM6w5jw==';

const validJsonBody = `{
  "grant_type": "client_credentials",
  "client_id": "Hometown SIS",
  "client_secret": "123456"
}`;

const jsonAuthorizationRequest: AuthorizationRequest = {
  ...newAuthorizationRequest(),
  path: '/oauth/token',
};

const formAuthorizationRequest: AuthorizationRequest = {
  ...jsonAuthorizationRequest,
  path: '/oauth/token',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
};

describe('given authorization store is going to fail', () => {
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
    response = await requestToken({ ...jsonAuthorizationRequest, body: validJsonBody });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('does not return a message body', () => {
    expect(response.body).toEqual('');
  });
});

describe('given request body is invalid x-www-form-urlencoded', () => {
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
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'Not form-urlencoded',
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
      `"{"error":"[{\\"message\\":\\"{requestBody} must have required property 'grant_type'\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"required\\"}},{\\"message\\":\\"'Not form-urlencoded' property is not expected to be here\\",\\"suggestion\\":\\"Did you mean property 'client_id'?\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"additionalProperties\\"}}]"}"`,
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
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'abc=123',
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
      `"{"error":"[{\\"message\\":\\"{requestBody} must have required property 'grant_type'\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"required\\"}},{\\"message\\":\\"'abc' property is not expected to be here\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"additionalProperties\\"}}]"}"`,
    );
  });
});

describe('given request body is valid x-www-form-urlencoded but has client_id without grant_type', () => {
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
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'client_id=123',
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
      `"{"error":"[{\\"message\\":\\"{requestBody} must have required property 'client_secret'\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"required\\"}},{\\"message\\":\\"{requestBody} must not be valid\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"not\\"}},{\\"message\\":\\"{requestBody} must have required property 'grant_type'\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"required\\"}}]"}"`,
    );
  });
});

describe('given request body is valid x-www-form-urlencoded but has client_id and grant_type without client_secret', () => {
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
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'client_id=123&grant_type=client_credentials',
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
      `"{"error":"[{\\"message\\":\\"{requestBody} must have required property 'client_secret'\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"required\\"}},{\\"message\\":\\"{requestBody} must not be valid\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"not\\"}}]"}"`,
    );
  });
});

describe('given request body has x-www-form-urlencoded grant_type and no authorization header', () => {
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
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'grant_type=client_credentials',
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`"{"error":"Missing authorization header"}"`);
  });
});

describe('given request body has x-www-form-urlencoded grant_type and invalid authorization header', () => {
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
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'grant_type=client_credentials',
      headers: { ...formAuthorizationRequest.headers, authorization: 'inv' },
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`"{"error":"Invalid authorization header"}"`);
  });
});

describe('given request body is x-www-form-urlencoded grant_type with valid hardcoded credential', () => {
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

    const unencodedCredentials = `${admin1.key}:${admin1.secret}`;
    const encodedCredentials = Buffer.from(unencodedCredentials).toString('base64');

    // Act
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'grant_type=client_credentials',
      headers: { ...formAuthorizationRequest.headers, authorization: `Basic ${encodedCredentials}` },
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns an access token', () => {
    const token = JSON.parse(response.body);
    expect(token.access_token).toMatch(/^eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9/);
    expect(token.token_type).toBe('bearer');
    expect(token.expires_in).toBeGreaterThan(166566000);
    expect(token.refresh_token).toBe('not available');
  });
});

describe('given request body is x-www-form-urlencoded grant_type with valid hardcoded credential but grant_type is not client_credentials', () => {
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

    const unencodedCredentials = `${client1.key}:${client1.secret}`;
    const encodedCredentials = Buffer.from(unencodedCredentials).toString('base64');

    // Act
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'grant_type=not_client_credentials',
      headers: { ...formAuthorizationRequest.headers, authorization: `Basic ${encodedCredentials}` },
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
      `"{"error":"[{\\"message\\":\\"'grant_type' property must be equal to one of the allowed values\\",\\"suggestion\\":\\"Did you mean 'client_credentials'?\\",\\"path\\":\\"{requestBody}.grant_type\\",\\"context\\":{\\"errorType\\":\\"enum\\",\\"allowedValues\\":[\\"client_credentials\\"]}}]"}"`,
    );
  });
});

describe('given request body is x-www-form-urlencoded grant_type with credential but authorization datastore has unknown failure', () => {
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

    const unencodedCredentials = 'valid_key:valid_secret';
    const encodedCredentials = Buffer.from(unencodedCredentials).toString('base64');

    // Act
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'grant_type=client_credentials',
      headers: { ...formAuthorizationRequest.headers, authorization: `Basic ${encodedCredentials}` },
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`""`);
  });
});

describe('given request body is x-www-form-urlencoded grant_type with credential not in authorization datastore', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_FAILURE_NOT_EXISTS',
        }),
    });

    const unencodedCredentials = 'valid_key:valid_secret';
    const encodedCredentials = Buffer.from(unencodedCredentials).toString('base64');

    // Act
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'grant_type=client_credentials',
      headers: { ...formAuthorizationRequest.headers, authorization: `Basic ${encodedCredentials}` },
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`""`);
  });
});

describe('given request body is x-www-form-urlencoded grant_type with credential client_id in authorization datastore but wrong secret', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['admin'],
          clientSecretHashed: 'not_a_matching_hashed_secret',
        }),
    });

    const unencodedCredentials = 'valid_key:wrong_secret';
    const encodedCredentials = Buffer.from(unencodedCredentials).toString('base64');

    // Act
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'grant_type=client_credentials',
      headers: { ...formAuthorizationRequest.headers, authorization: `Basic ${encodedCredentials}` },
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 401', () => {
    expect(response.statusCode).toEqual(401);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`""`);
  });
});

describe('given request body is x-www-form-urlencoded grant_type with valid credential in authorization datastore', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  const clientSecretHexString = 'ABCDEFABCDEF';
  const clientSecretHashed = hashClientSecretHexString(clientSecretHexString);

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['admin'],
          clientSecretHashed,
        }),
    });

    const unencodedCredentials = `valid_key:${clientSecretHexString}`;
    const encodedCredentials = Buffer.from(unencodedCredentials).toString('base64');

    // Act
    response = await requestToken({
      ...formAuthorizationRequest,
      body: 'grant_type=client_credentials',
      headers: { ...formAuthorizationRequest.headers, authorization: `Basic ${encodedCredentials}` },
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns an access token', () => {
    const token = JSON.parse(response.body);
    expect(token.access_token).toMatch(/^eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9/);
    expect(token.token_type).toBe('bearer');
    expect(token.expires_in).toBeGreaterThan(166566000);
    expect(token.refresh_token).toBe('not available');
  });
});

describe('given request body is invalid json', () => {
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
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: 'Not JSON',
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`"{"error":"Malformed body: Unexpected token N in JSON at position 0"}"`);
  });
});

describe('given request body is valid json but without expected fields', () => {
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
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: '{"abc":"123"}',
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
      `"{"error":"[{\\"message\\":\\"{requestBody} must have required property 'grant_type'\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"required\\"}},{\\"message\\":\\"'abc' property is not expected to be here\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"additionalProperties\\"}}]"}"`,
    );
  });
});

describe('given request body is valid json with client_id but without grant_type', () => {
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
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: '{"client_id":"123"}',
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
      `"{"error":"[{\\"message\\":\\"{requestBody} must have required property 'client_secret'\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"required\\"}},{\\"message\\":\\"{requestBody} must not be valid\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"not\\"}},{\\"message\\":\\"{requestBody} must have required property 'grant_type'\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"required\\"}}]"}"`,
    );
  });
});

describe('given request body is valid json with client_id and grant_type but without client_secret', () => {
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
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: '{"client_id":"123", "grant_type":"client_credentials"}',
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
      `"{"error":"[{\\"message\\":\\"{requestBody} must have required property 'client_secret'\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"required\\"}},{\\"message\\":\\"{requestBody} must not be valid\\",\\"path\\":\\"{requestBody}\\",\\"context\\":{\\"errorType\\":\\"not\\"}}]"}"`,
    );
  });
});

describe('given request body is json with grant_type and no authorization header', () => {
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
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: '{"grant_type":"client_credentials"}',
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`"{"error":"Missing authorization header"}"`);
  });
});

describe('given request body is json with grant_type and invalid authorization header', () => {
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
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: '{"grant_type":"client_credentials"}',
      headers: { authorization: 'inv' },
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`"{"error":"Invalid authorization header"}"`);
  });
});

describe('given request body is json with valid hardcoded credential', () => {
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
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: JSON.stringify({ grant_type: 'client_credentials', client_id: client1.key, client_secret: client1.secret }),
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns an access token', () => {
    const token = JSON.parse(response.body);
    expect(token.access_token).toMatch(/^eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9/);
    expect(token.token_type).toBe('bearer');
    expect(token.expires_in).toBeGreaterThan(166566000);
    expect(token.refresh_token).toBe('not available');
  });
});

describe('given request body is json with valid hardcoded credential but grant_type is not client_credentials', () => {
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
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: JSON.stringify({ grant_type: 'not_client_credentials', client_id: client1.key, client_secret: client1.secret }),
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
      `"{"error":"[{\\"message\\":\\"'grant_type' property must be equal to one of the allowed values\\",\\"suggestion\\":\\"Did you mean 'client_credentials'?\\",\\"path\\":\\"{requestBody}.grant_type\\",\\"context\\":{\\"errorType\\":\\"enum\\",\\"allowedValues\\":[\\"client_credentials\\"]}}]"}"`,
    );
  });
});

describe('given request body is json with credential but authorization datastore has unknown failure', () => {
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
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: JSON.stringify({ grant_type: 'client_credentials', client_id: 'valid_key', client_secret: 'valid_secret' }),
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`""`);
  });
});

describe('given request body is json with credential not in authorization datastore', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_FAILURE_NOT_EXISTS',
        }),
    });

    // Act
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: JSON.stringify({ grant_type: 'client_credentials', client_id: 'valid_key', client_secret: 'valid_secret' }),
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`""`);
  });
});

describe('given request body is json with credential client_id in authorization datastore but wrong secret', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['admin'],
          clientSecretHashed: 'not_a_matching_hashed_secret',
        }),
    });

    // Act
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: JSON.stringify({ grant_type: 'client_credentials', client_id: 'valid_key', client_secret: 'wrong_secret' }),
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 401', () => {
    expect(response.statusCode).toEqual(401);
  });

  it('returns error message', () => {
    expect(response.body).toMatchInlineSnapshot(`""`);
  });
});

describe('given request body is json with valid credential in authorization datastore', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;

  const clientSecretHexString = 'ABCDEFABCDEF';
  const clientSecretHashed = hashClientSecretHexString(clientSecretHexString);

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clientName: 'clientName',
          roles: ['admin'],
          clientSecretHashed,
        }),
    });

    // Act
    response = await requestToken({
      ...jsonAuthorizationRequest,
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: 'valid_key',
        client_secret: clientSecretHexString,
      }),
    });
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns an access token', () => {
    const token = JSON.parse(response.body);
    expect(token.access_token).toMatch(/^eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9/);
    expect(token.token_type).toBe('bearer');
    expect(token.expires_in).toBeGreaterThan(166566000);
    expect(token.refresh_token).toBe('not available');
  });
});
