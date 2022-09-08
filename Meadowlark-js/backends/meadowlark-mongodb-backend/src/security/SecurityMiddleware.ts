// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger, MiddlewareModel, writeRequestToLog } from '@edfi/meadowlark-core';
import { MongoClient } from 'mongodb';
import { rejectByOwnershipSecurity } from '../repository/OwnershipSecurity';
import { SecurityResult } from './SecurityResponse';

/**
 * Enforces document store authorization for this backend
 */
export async function securityMiddleware(
  { frontendRequest, frontendResponse }: MiddlewareModel,
  client: MongoClient,
): Promise<MiddlewareModel> {
  const moduleName = 'MongoDBBackend.SecurityMiddleware';

  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'securityMiddleware');

  // Ownership-based is the only one for now. When others are implemented, do as
  // a stack of security middlewares with this as entry point
  if (frontendRequest.middleware.security.authorizationStrategy !== 'OWNERSHIP_BASED') {
    Logger.debug(`${moduleName}.securityMiddleware - ownership based security does not apply`, frontendRequest.traceId);
    return { frontendRequest, frontendResponse };
  }

  const securityResult: SecurityResult = await rejectByOwnershipSecurity(frontendRequest, client);
  if (securityResult === 'ACCESS_APPROVED' || securityResult === 'NOT_APPLICABLE')
    return { frontendRequest, frontendResponse };

  if (securityResult === 'UNKNOWN_FAILURE')
    return { frontendRequest, frontendResponse: { statusCode: 500, headers: {}, body: '' } };

  return { frontendRequest, frontendResponse: { statusCode: 403, headers: {}, body: '' } };
}
