// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
import { PathComponents, pathComponentsFrom } from '../model/PathComponents';
import { getById } from './GetById';
import { query } from './Query';
import { validateJwt } from '../security/JwtValidator';
import { authorizationHeader } from '../security/AuthorizationHeader';

const moduleName = 'Get';

/**
 * Entry point for all API GET requests
 *
 * Determines whether request is "get all", "get by id", or a query, and forwards to the appropriate handler
 */
export async function getResolver(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    writeRequestToLog(moduleName, event, context, 'getResolver');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(event));
    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, context, 'getResolver', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as APIGatewayProxyResult;
    }

    const pathComponents: PathComponents | null = pathComponentsFrom(event.path);
    if (pathComponents === null) {
      writeDebugStatusToLog(moduleName, context, 'getResolver', 404);
      return { body: '', statusCode: 404 };
    }

    let edOrgIds: string[] = [];
    if (event.headers['x-security-edorgid'] != null) edOrgIds = (event.headers['x-security-edorgid'] as string).split(',');

    let studentIds: string[] = [];
    if (event.headers['x-security-studentid'] != null)
      studentIds = (event.headers['x-security-studentid'] as string).split(',');

    const throughAssociation = event.headers['x-security-through'];
    if (pathComponents.resourceId != null)
      return await getById(pathComponents, context, {
        edOrgIds,
        studentIds,
        throughAssociation,
        isOwnershipEnabled: jwtStatus.isOwnershipEnabled,
        clientName: jwtStatus.subject,
      });

    return await query(pathComponents, event.queryStringParameters ?? {}, context);
  } catch (e) {
    writeErrorToLog(moduleName, context, event, 'getResolver', 500, e);
    return { body: '', statusCode: 500 };
  }
}
