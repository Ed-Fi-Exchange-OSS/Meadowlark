// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config } from '@edfi/meadowlark-utilities';
import {
  ValidateTokenResult,
  validateTokenForAccess,
  validateAdminTokenForAccess,
  introspectBearerToken,
} from '../../src/security/TokenValidator';
import { AuthorizationResponse } from '../../src/handler/AuthorizationResponse';
import * as AuthorizationPluginLoader from '../../src/plugin/AuthorizationPluginLoader';
import { NoAuthorizationStorePlugin } from '../../src/plugin/NoAuthorizationStorePlugin';
import { createAuthorizationHeader, createTokenString, ONE_HOUR_AGO, ONE_HOUR_FROM_NOW } from './TestHelper';
import { IntrospectionResponse } from '../../src/model/TokenResponse';

const audience = 'aud';
const issuer = 'iss';

const setupMockConfiguration = () => {
  jest.spyOn(Config, 'get').mockImplementation((key: Config.ConfigKeys) => {
    switch (key) {
      case 'OAUTH_SIGNING_KEY':
        return 'v/AbsYGRvIfCf1bxufA6+Ras5NR+kIroLUg5RKYMjmqvNa1fVanmPBXKFH+MD1TPHpSgna0g+6oRnmRGUme6vJ7x91OA7Lp1hWzr6NnpdLYA9BmDHWjkRFvlx9bVmP+GTave2E4RAYa5b/qlvXOVnwaqEWzHxefqzkd1F1mQ6dVNFWYdiOmgw8ofQ87Xi1W0DkToRNS/Roc4rxby/BZwHUj7Y4tYdMpkWDMrZK6Vwat1KuPyiqsaBQYa9Xd0pxKqUOrAp8a+BFwiPfxf4nyVdOSAd77A/wuKIJaERNY5xJXUHwNgEOMf+Lg4032u4PnsnH7aJb2F4z8AhHldM6w5jw==';
      case 'OAUTH_TOKEN_ISSUER':
        return issuer;
      case 'OAUTH_TOKEN_AUDIENCE':
        return audience;
      case 'OAUTH_EXPIRATION_MINUTES':
        return 60;
      default:
        throw new Error(`Key '${key}' not configured`);
    }
  });
};

const traceId = 'this is a trace id';

describe('given validation of missing token', () => {
  let result: ValidateTokenResult;

  beforeAll(async () => {
    setupMockConfiguration();

    // Act
    result = validateTokenForAccess(undefined, traceId);
  });

  it('returns missing', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "errorResponse": {
          "body": {
            "error": "invalid_client",
            "error_description": "Authorization token not provided",
          },
          "headers": {
            "WWW-Authenticate": "Bearer",
          },
          "statusCode": 401,
        },
        "isValid": false,
      }
    `);
  });
});

describe('given validation of expired token', () => {
  let result: ValidateTokenResult;

  beforeAll(async () => {
    setupMockConfiguration();

    const token = createAuthorizationHeader('clientId', ['vendor'], ONE_HOUR_AGO);

    // Act
    result = validateTokenForAccess(token, traceId);
  });

  it('returns expired', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "errorResponse": {
          "body": {
            "error": "invalid_token",
            "error_description": "Token is expired",
          },
          "headers": {
            "WWW-Authenticate": "Bearer",
          },
          "statusCode": 401,
        },
        "isValid": false,
      }
    `);
  });
});

describe('given validation of invalid token', () => {
  let result: ValidateTokenResult;

  beforeAll(async () => {
    setupMockConfiguration();

    const token = 'bearer notValidToken';

    // Act
    result = validateTokenForAccess(token, traceId);
  });

  it('returns invalid', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "errorResponse": {
          "body": {
            "error": "invalid_token",
            "error_description": "Invalid authorization token",
          },
          "headers": {
            "WWW-Authenticate": "Bearer",
          },
          "statusCode": 401,
        },
        "isValid": false,
      }
    `);
  });
});

describe('given validation of valid token', () => {
  let result: ValidateTokenResult;

  beforeAll(async () => {
    setupMockConfiguration();

    const token = createAuthorizationHeader('clientId', ['vendor']);

    // Act
    result = validateTokenForAccess(token, traceId);
  });

  it('returns valid with token information', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "clientId": "clientId",
        "isValid": true,
        "roles": [
          "vendor",
        ],
      }
    `);
  });
});

describe('given admin validation of non-admin token', () => {
  let result: AuthorizationResponse | undefined;

  beforeAll(async () => {
    setupMockConfiguration();

    const token = createAuthorizationHeader('clientId', ['vendor']);

    // Act
    result = validateAdminTokenForAccess(token, traceId);
  });

  it('returns forbidden', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "headers": {
          "WWW-Authenticate": "Bearer",
        },
        "statusCode": 403,
      }
    `);
  });
});

describe('given admin validation of admin token', () => {
  let result: AuthorizationResponse | undefined;

  beforeAll(async () => {
    setupMockConfiguration();

    const token = createAuthorizationHeader('clientId', ['admin']);

    // Act
    result = validateAdminTokenForAccess(token, traceId);
  });

  it('returns no error response', () => {
    expect(result).toBeUndefined();
  });
});

describe('given introspection of expired token', () => {
  let result: IntrospectionResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    const token = createTokenString('clientId', ['vendor'], ONE_HOUR_AGO);

    // Act
    result = await introspectBearerToken(token, 'traceId');
  });

  it('returns expired', () => {
    expect(result.isValid).toBe(true);
    expect((result as any).introspectedToken.active).toBe(false);
    expect((result as any).introspectedToken.aud).toBe(audience);
    expect((result as any).introspectedToken.client_id).toBe('clientId');
    expect((result as any).introspectedToken.iss).toBe(issuer);
    expect((result as any).introspectedToken.roles).toHaveLength(1);
    expect((result as any).introspectedToken.roles[0]).toBe('vendor');
  });
});

describe('given introspection of invalid token', () => {
  let result: IntrospectionResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    const token = 'notValidToken';

    // Act
    result = await introspectBearerToken(token, 'traceId');
  });

  it('returns invalid', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "isValid": false,
      }
    `);
  });
});

describe('given introspection of token from wrong issuer', () => {
  let result: IntrospectionResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    const token = createTokenString('clientId', ['vendor'], ONE_HOUR_FROM_NOW, 'wrongIssuer');

    // Act
    result = await introspectBearerToken(token, 'traceId');
  });

  it('returns invalid', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "isValid": false,
      }
    `);
  });
});

describe('given validation of valid token with clientId no longer in datastore', () => {
  let result: IntrospectionResponse;

  beforeAll(async () => {
    setupMockConfiguration();

    jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAuthorizationClient: async () =>
        Promise.resolve({
          response: 'GET_FAILURE_NOT_EXISTS',
        }),
    });

    const token = createTokenString('clientId', ['vendor']);

    // Act
    result = await introspectBearerToken(token, 'traceId');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns valid with inactive token information', () => {
    expect(result.isValid).toBe(true);
    const tokenResponse = (result as any).introspectedToken;
    expect(tokenResponse.active).toBe(false);
    expect(tokenResponse.aud).toBe(audience);
    expect(tokenResponse.client_id).toBe('clientId');
    expect(tokenResponse.iss).toBe(issuer);
    expect(tokenResponse.roles).toHaveLength(1);
    expect(tokenResponse.roles[0]).toBe('vendor');
  });
});

describe('given validation of valid token with clientId in datastore', () => {
  let result: IntrospectionResponse;

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

    const token = createTokenString('clientId', ['vendor']);

    // Act
    result = await introspectBearerToken(token, 'traceId');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns valid with active token information', () => {
    expect(result.isValid).toBe(true);
    expect((result as any).introspectedToken.active).toBe(true);
    expect((result as any).introspectedToken.aud).toBe(audience);
    expect((result as any).introspectedToken.client_id).toBe('clientId');
    expect((result as any).introspectedToken.iss).toBe(issuer);
    expect((result as any).introspectedToken.roles).toHaveLength(1);
    expect((result as any).introspectedToken.roles[0]).toBe('vendor');
  });
});
