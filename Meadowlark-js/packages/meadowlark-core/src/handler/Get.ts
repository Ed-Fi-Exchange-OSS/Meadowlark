// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
import { PathComponents, pathComponentsFrom } from '../model/PathComponents';
import { getById } from './GetById';
import { query } from './Query';
import { validateJwt } from '../security/JwtValidator';
import { authorizationHeader } from '../security/AuthorizationHeader';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

const moduleName = 'Get';

/**
 * Entry point for all API GET requests
 *
 * Determines whether request is "get all", "get by id", or a query, and forwards to the appropriate handler
 */
export async function getResolver(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'getResolver');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(frontendRequest));
    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'getResolver', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as FrontendResponse;
    }

    const pathComponents: PathComponents | null = pathComponentsFrom(frontendRequest.path);
    if (pathComponents === null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'getResolver', 404);
      return { body: '', statusCode: 404 };
    }

    let edOrgIds: string[] = [];
    if (frontendRequest.headers['x-security-edorgid'] != null)
      edOrgIds = (frontendRequest.headers['x-security-edorgid'] as string).split(',');

    let studentIds: string[] = [];
    if (frontendRequest.headers['x-security-studentid'] != null)
      studentIds = (frontendRequest.headers['x-security-studentid'] as string).split(',');

    const throughAssociation = frontendRequest.headers['x-security-through'];
    if (pathComponents.resourceId != null)
      return await getById(pathComponents, frontendRequest, {
        edOrgIds,
        studentIds,
        throughAssociation,
        isOwnershipEnabled: jwtStatus.isOwnershipEnabled,
        clientName: jwtStatus.subject,
      });

    return await query(pathComponents, frontendRequest);
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'getResolver', 500, e);
    return { body: '', statusCode: 500 };
  }
}
