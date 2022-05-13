// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { validateJwt } from '../security/JwtValidator';
import { authorizationHeader } from '../security/AuthorizationHeader';
import { MiddlewareChain } from './MiddlewareChain';

const moduleName = 'AuthenticationMiddleware';

/**
 * Handles authentication
 */
export async function authenticate({ frontendRequest, frontendResponse }: MiddlewareChain): Promise<MiddlewareChain> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'authenticate');

  const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(frontendRequest));
  if (errorResponse != null) {
    writeDebugStatusToLog(moduleName, frontendRequest, 'authenticate', errorResponse.statusCode, JSON.stringify(jwtStatus));
    return { frontendRequest, frontendResponse: errorResponse };
  }

  // TODO RND-262: Pick out authorization strategy from JWT
  frontendRequest.middleware.security = {
    authorizationStrategy: 'OWNERSHIP_BASED',
    clientName: jwtStatus.subject ?? 'UNKNOWN',
  };
  return { frontendRequest, frontendResponse: null };
}
