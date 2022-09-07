// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { validateJwt } from '../security/JwtValidator';
import { authorizationHeader } from '../security/AuthorizationHeader';
import { MiddlewareModel } from './MiddlewareModel';
import { AuthorizationStrategy } from '../security/Security';

const moduleName = 'AuthorizationMiddleware';

/**
 * Handles authorization
 */
export async function authorize({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };

  // TODO: This is logging the request body. Useful for prototype debugging but not good
  // for a real application. RND-286.
  writeRequestToLog(moduleName, frontendRequest, 'authorize');

  const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(frontendRequest));
  if (errorResponse != null) {
    writeDebugStatusToLog(moduleName, frontendRequest, 'authorize', errorResponse.statusCode, JSON.stringify(jwtStatus));
    return { frontendRequest, frontendResponse: errorResponse };
  }

  frontendRequest.middleware.security = {
    authorizationStrategy: jwtStatus.authorizationStrategy as AuthorizationStrategy,
    clientId: jwtStatus.clientId ?? 'UNKNOWN',
    validateResources: !jwtStatus.roles.includes('assessment'),
  };
  return { frontendRequest, frontendResponse: null };
}
