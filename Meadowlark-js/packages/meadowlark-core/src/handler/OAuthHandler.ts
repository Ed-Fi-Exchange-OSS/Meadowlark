// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import querystring from 'querystring';
import secureRandom from 'secure-random';
import { Logger } from '../Logger';
import { client1, client2 } from '../security/HardcodedCredential';
import { createToken } from '../security/JwtAction';
import { Jwt } from '../security/Jwt';
import { validateJwt } from '../security/JwtValidator';
import { authorizationHeader } from '../security/AuthorizationHeader';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

function createTokenResponse(token: Jwt): string {
  return JSON.stringify({
    access_token: token.compact(),
    token_type: 'bearer',
    expires_in: 3845548881 - Math.floor(Date.now() / 1000),
    refresh_token: 'not available',
  });
}

/*
 * OAuth2.0 style authentication endpoint. Currently backed by a hard-coded "in-memory" database of two sets of credentials.
 * Generates a JSON Web Token.
 */
export async function postToken(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  Logger.info('OAuthHandler.postToken', frontendRequest.traceId);
  Logger.info(frontendRequest.body?.toString() || '', frontendRequest.traceId, 'n/a');

  if (frontendRequest.body == null) {
    return {
      body: 'Try submitting an OAuth2.0 Client Credential form',
      statusCode: 400,
    };
  }

  // eslint-disable-next-line camelcase
  let body: { grant_type?: string; client_id?: string; client_secret?: string };
  if (frontendRequest.headers['content-type'] === 'application/x-www-form-urlencoded') {
    body = querystring.parse(frontendRequest.body);
  } else {
    body = JSON.parse(frontendRequest.body);
  }

  if (body.grant_type === 'client_credentials') {
    const { client_id: clientId, client_secret: clientSecret } = body;

    if (clientId === client1.key && clientSecret === client1.secret) {
      return {
        body: createTokenResponse(createToken(client1.vendor)),
        statusCode: 200,
      };
    }
    if (clientId === client2.key && clientSecret === client2.secret) {
      return {
        body: createTokenResponse(createToken(client2.vendor)),
        statusCode: 200,
      };
    }
  }

  return {
    body: '',
    statusCode: 401,
  };
}

/*
 * Creates an encoded 256 bit key appropriate for signing JWTs.
 */
export async function createRandomSigningKey(): Promise<FrontendResponse> {
  return {
    body: JSON.stringify({ key: secureRandom(256, { type: 'Buffer' }).toString('base64') }),
    statusCode: 201,
  };
}

export async function verify(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  Logger.debug(JSON.stringify(frontendRequest.headers), frontendRequest.traceId);

  const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(frontendRequest));

  if (errorResponse == null) {
    return {
      statusCode: 200,
      body: JSON.stringify(jwtStatus),
    };
  }

  return errorResponse;
}

/*
 * Single point of entry for both functions.
 */
export async function handler(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  if (frontendRequest.path.endsWith('createKey')) return createRandomSigningKey();
  if (frontendRequest.path.endsWith('verify')) return verify(frontendRequest);
  return postToken(frontendRequest);
}
