// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import querystring from 'querystring';
import secureRandom from 'secure-random';
import { Logger } from '../Logger';
import { client1, client2, client3, client4 } from '../security/HardcodedCredential';
import { createToken } from '../security/JwtAction';
import { Jwt } from '../security/Jwt';
import { validateJwt } from '../security/JwtValidator';
import { authorizationHeader } from '../security/AuthorizationHeader';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

type OAuthRequest = { grant_type?: string; client_id?: string; client_secret?: string; Grant_type?: string };

function createTokenResponse(token: Jwt): string {
  return JSON.stringify({
    access_token: token.compact(),
    token_type: 'bearer',
    expires_in: token.body.exp,
    refresh_token: 'not available',
  });
}

function maskClientSecret(body: OAuthRequest): string {
  const masked = body.client_secret != null ? `${body.client_secret.slice(body.client_secret.length - 4)}` : '';

  return `grant_type: ${body.grant_type || ''}, client_id: ${body.client_id || ''}, client_secret: ****${masked}`;
}

function parseRequest(frontendRequest: FrontendRequest): OAuthRequest | null {
  if (frontendRequest.body == null) return null;

  let body: OAuthRequest;
  // startsWith accounts for possibility of the content-type being with or without encoding
  if (frontendRequest.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) {
    body = querystring.parse(frontendRequest.body);
  } else {
    body = JSON.parse(frontendRequest.body);
  }

  // The Ed-Fi console bulk loader incorrectly uses "Grant_type" instead of "grant_type" (ODS-5466).
  if (body.Grant_type) {
    body.grant_type = body.Grant_type;
  }

  // There are two techniques for passing client id and client secret: directly in the payload, or as an Authorization
  // header. Detect the latter, and then decode and parse the id and secret from the header.
  if (body.client_id) return body;

  if (!('authorization' in frontendRequest.headers)) {
    return null;
  }

  // Extract from "Basic <encoded>" where encoded is the Base64 form of "client_id:client_secret"
  const authHeader: string = frontendRequest.headers.authorization ?? '';
  const split = Buffer.from(authHeader.slice(6), 'base64').toString('binary').split(':');
  if (split.length !== 2) {
    return null;
  }

  [body.client_id, body.client_secret] = split;

  return body;
}

/*
 * OAuth2.0 style authentication endpoint. Currently backed by a hard-coded "in-memory" database of two sets of credentials.
 * Generates a JSON Web Token.
 */
export async function postToken(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  Logger.info('OAuthHandler.postToken', frontendRequest.traceId);

  const body = parseRequest(frontendRequest);
  if (body == null) {
    return {
      body: JSON.stringify({ error: 'Try submitting an OAuth2.0 Client Credential form' }),
      statusCode: 400,
    };
  }
  Logger.debug(maskClientSecret(body), frontendRequest.traceId);

  if (body.grant_type === 'client_credentials') {
    const { client_id: clientId, client_secret: clientSecret } = body;

    if (clientId === client1.key && clientSecret === client1.secret) {
      return {
        body: createTokenResponse(createToken(client1.key, client1.vendor, client1.role)),
        statusCode: 200,
      };
    }
    if (clientId === client2.key && clientSecret === client2.secret) {
      return {
        body: createTokenResponse(createToken(client2.key, client2.vendor, client1.role)),
        statusCode: 200,
      };
    }
    if (clientId === client3.key && clientSecret === client3.secret) {
      return {
        body: createTokenResponse(createToken(client3.key, client3.vendor, client3.role)),
        statusCode: 200,
      };
    }
    if (clientId === client4.key && clientSecret === client4.secret) {
      return {
        body: createTokenResponse(createToken(client4.key, client4.vendor, client4.role)),
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

  const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(frontendRequest.headers));

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
