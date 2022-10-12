// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import secureRandom from 'secure-random';
import { Logger } from '../Logger';
import { validateJwt } from '../security/JwtValidator';
import { authorizationHeader } from '../security/AuthorizationHeader';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

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
  return verify(frontendRequest);
}
