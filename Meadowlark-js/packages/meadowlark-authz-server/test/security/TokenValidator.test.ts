// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { create as createJwt } from 'njwt';
import { TOKEN_ISSUER } from '../../src/security/TokenIssuer';
import type { Jwt } from '../../src/security/Jwt';
import { signingKey } from '../../src/model/SigningKey';
import { ValidateTokenResult, validateTokenForAccess, validateAdminTokenForAccess } from '../../src/security/TokenValidator';
import { AuthorizationResponse } from '../../src/handler/AuthorizationResponse';

process.env.SIGNING_KEY =
  'v/AbsYGRvIfCf1bxufA6+Ras5NR+kIroLUg5RKYMjmqvNa1fVanmPBXKFH+MD1TPHpSgna0g+6oRnmRGUme6vJ7x91OA7Lp1hWzr6NnpdLYA9BmDHWjkRFvlx9bVmP+GTave2E4RAYa5b/qlvXOVnwaqEWzHxefqzkd1F1mQ6dVNFWYdiOmgw8ofQ87Xi1W0DkToRNS/Roc4rxby/BZwHUj7Y4tYdMpkWDMrZK6Vwat1KuPyiqsaBQYa9Xd0pxKqUOrAp8a+BFwiPfxf4nyVdOSAd77A/wuKIJaERNY5xJXUHwNgEOMf+Lg4032u4PnsnH7aJb2F4z8AhHldM6w5jw==';

const ONE_HOUR_FROM_NOW = new Date().getTime() + 60 * 60 * 1000;
const ONE_HOUR_AGO = new Date().getTime() - 60 * 60 * 1000;

function createTokenString(
  clientId: string,
  roles: string[],
  expirationMillis: number = ONE_HOUR_FROM_NOW,
  tokenIssuer: string = TOKEN_ISSUER,
): string {
  const token: Jwt = createJwt({ iss: tokenIssuer, aud: tokenIssuer, roles, client_id: clientId }, signingKey()) as Jwt;
  token.setExpiration(expirationMillis);
  return token.compact();
}

function createAuthorizationHeader(
  clientId: string,
  roles: string[],
  expirationMillis: number = ONE_HOUR_FROM_NOW,
  tokenIssuer: string = TOKEN_ISSUER,
): string {
  return `bearer ${createTokenString(clientId, roles, expirationMillis, tokenIssuer)}`;
}

describe('given validation of missing token', () => {
  let result: ValidateTokenResult;

  beforeAll(async () => {
    // Act
    result = validateTokenForAccess(undefined);
  });

  it('returns missing', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "errorResponse": {
          "body": "{ "error": "invalid_client", "error_description": "Authorization token not provided" }",
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
    const token = createAuthorizationHeader('clientId', ['vendor'], ONE_HOUR_AGO);

    // Act
    result = validateTokenForAccess(token);
  });

  it('returns expired', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "errorResponse": {
          "body": "{ "error": "invalid_token", "error_description": "Token is expired" }",
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
    const token = 'bearer notValidToken';

    // Act
    result = validateTokenForAccess(token);
  });

  it('returns invalid', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "errorResponse": {
          "body": "{ "error": "invalid_token", "error_description": "Invalid authorization token" }",
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
    const token = createAuthorizationHeader('clientId', ['vendor'], ONE_HOUR_FROM_NOW);

    // Act
    result = validateTokenForAccess(token);
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
    const token = createAuthorizationHeader('clientId', ['vendor'], ONE_HOUR_FROM_NOW);

    // Act
    result = validateAdminTokenForAccess(token);
  });

  it('returns forbidden', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "body": "",
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
    const token = createAuthorizationHeader('clientId', ['admin'], ONE_HOUR_FROM_NOW);

    // Act
    result = validateAdminTokenForAccess(token);
  });

  it('returns no error response', () => {
    expect(result).toBeUndefined();
  });
});
