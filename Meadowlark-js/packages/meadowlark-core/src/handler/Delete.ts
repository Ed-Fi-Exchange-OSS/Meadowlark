// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { validateResource } from '../validation/RequestValidator';
import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../helpers/Logger';
import { PathComponents, pathComponentsFrom } from '../model/PathComponents';
import { NoEntityInfo } from '../model/DocumentInfo';
import { validateJwt } from '../helpers/JwtValidator';
import { newSecurity } from '../model/Security';
import { authorizationHeader } from '../helpers/AuthorizationHeader';
import { getBackendPlugin } from '../plugin/PluginLoader';

const moduleName = 'Delete';

/**
 * Entry point for all API DELETE requests, which are "by id"
 *
 * Validates resource and forwards to backend for deletion
 */
export async function deleteIt(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const { awsRequestId } = context;
  try {
    writeRequestToLog(moduleName, event, context, 'deleteIt');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(event));
    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, context, 'deleteIt', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as APIGatewayProxyResult;
    }

    const pathComponents: PathComponents | null = pathComponentsFrom(event.path);
    if (pathComponents === null || pathComponents.resourceId == null) {
      writeDebugStatusToLog(moduleName, context, 'deleteIt', 404);
      return { body: '', statusCode: 404 };
    }

    const { documentInfo, errorBody, headerMetadata } = await validateResource(pathComponents, null);
    if (errorBody !== null) {
      const statusCode = documentInfo === NoEntityInfo ? 404 : 400;
      writeDebugStatusToLog(moduleName, context, 'deleteIt', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: headerMetadata };
    }

    const { result, failureMessage } = await getBackendPlugin().deleteEntityById(
      pathComponents.resourceId,
      documentInfo,
      {
        referenceValidation: event.headers['reference-validation'] !== 'false',
        descriptorValidation: event.headers['descriptor-validation'] !== 'false',
      },
      {
        ...newSecurity(),
        isOwnershipEnabled: jwtStatus.isOwnershipEnabled,
        clientName: jwtStatus.subject,
      },
      awsRequestId,
    );

    if (result === 'DELETE_SUCCESS') {
      writeDebugStatusToLog(moduleName, context, 'deleteIt', 204);
      return { body: '', statusCode: 204, headers: headerMetadata };
    }
    if (result === 'DELETE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, context, 'deleteIt', 404);
      return { body: '', statusCode: 404, headers: headerMetadata };
    }
    if (result === 'DELETE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, context, 'deleteIt', 409, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 409, headers: headerMetadata };
    }
    writeDebugStatusToLog(moduleName, context, 'deleteIt', 500, failureMessage);
    return { body: JSON.stringify({ message: failureMessage ?? 'Failure' }), statusCode: 500, headers: headerMetadata };
  } catch (e) {
    writeErrorToLog(moduleName, context, event, 'deleteIt', 500, e);
    return { body: '', statusCode: 500 };
  }
}
