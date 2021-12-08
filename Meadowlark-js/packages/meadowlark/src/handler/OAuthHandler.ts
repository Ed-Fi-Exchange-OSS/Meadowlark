// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import querystring from 'querystring';
import secureRandom from 'secure-random';
import { Logger } from '../helpers/Logger';
import { client1, client2 } from '../security/HardcodedCredential';
import { createToken } from '../security/JwtAction';
import { Jwt } from '../security/Jwt';
import { validateJwt } from '../helpers/JwtValidator';

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
export async function postToken(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  Logger.info('OAuthHandler.postToken', context.awsRequestId, event.requestContext.requestId);
  Logger.info(event.body?.toString() || '', context.awsRequestId, 'n/a');

  if (event.body == null) {
    return {
      body: 'Try submitting an OAuth2.0 Client Credential form',
      statusCode: 400,
    };
  }

  // eslint-disable-next-line camelcase
  let body: { grant_type?: string; client_id?: string; client_secret?: string };
  if (event.headers['content-type'] === 'application/x-www-form-urlencoded') {
    body = querystring.parse(event.body);
  } else {
    body = JSON.parse(event.body);
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
export async function createRandomSigningKey(): Promise<APIGatewayProxyResult> {
  return {
    body: JSON.stringify({ key: secureRandom(256, { type: 'Buffer' }).toString('base64') }),
    statusCode: 201,
  };
}

export async function verify(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  Logger.debug(JSON.stringify(event.headers), context.awsRequestId, 'n/a');

  const { jwtStatus, errorResponse } = validateJwt(event.headers.authorization);

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
export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if (event.path.endsWith('createKey')) return createRandomSigningKey();
  if (event.path.endsWith('verify')) return verify(event, context);
  return postToken(event, context);
}
