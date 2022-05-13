// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeErrorToLog, writeRequestToLog } from '../Logger';
import { getById } from './GetById';
import { query } from './Query';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

const moduleName = 'Get';

/**
 * Entry point for all API GET requests
 *
 * Determines whether request is "get by id" or a query, and forwards to the appropriate handler
 */
export async function getResolver(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'getResolver');

    if (frontendRequest.middleware.pathComponents.resourceId == null) return await query(frontendRequest);

    return await getById(frontendRequest);
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'getResolver', 500, e);
    return { body: '', statusCode: 500 };
  }
}
