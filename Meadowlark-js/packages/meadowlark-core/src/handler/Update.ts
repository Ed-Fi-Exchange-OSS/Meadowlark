// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { validateResource } from '../validation/RequestValidator';
import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../helpers/Logger';
import { PathComponents, pathComponentsFrom } from '../model/PathComponents';
import { documentIdForDocumentInfo } from '../helpers/DocumentId';
import { NoDocumentInfo } from '../model/DocumentInfo';
import { validateJwt } from '../helpers/JwtValidator';
import { newSecurity } from '../model/Security';
import { authorizationHeader } from '../helpers/AuthorizationHeader';
import { getBackendPlugin } from '../plugin/PluginLoader';

const moduleName = 'Update';

/**
 * Entry point for all API PUT requests, which are "by id"
 *
 * Validates resource and JSON document shape, extracts keys and forwards to backend for update
 */
export async function update(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    writeRequestToLog(moduleName, event, context, 'update');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(event));
    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, context, 'update', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as APIGatewayProxyResult;
    }

    const pathComponents: PathComponents | null = pathComponentsFrom(event.path);
    if (pathComponents === null || pathComponents.resourceId == null) {
      writeDebugStatusToLog(moduleName, context, 'update', 404);
      return { body: '', statusCode: 404 };
    }

    if (event.body == null) {
      const message = 'Missing body';
      writeDebugStatusToLog(moduleName, context, 'update', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    let body: any = {};
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      const message = 'Malformed body';
      writeDebugStatusToLog(moduleName, context, 'update', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    const { documentInfo, errorBody, headerMetadata } = await validateResource(pathComponents, body);
    if (errorBody !== null) {
      const statusCode = documentInfo === NoDocumentInfo ? 404 : 400;
      writeDebugStatusToLog(moduleName, context, 'update', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: headerMetadata };
    }

    const resourceIdFromBody = documentIdForDocumentInfo(documentInfo);
    if (resourceIdFromBody !== pathComponents.resourceId) {
      const failureMessage = 'The identity of the resource does not match the identity in the updated document.';
      writeDebugStatusToLog(moduleName, context, 'update', 400, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 400, headers: headerMetadata };
    }

    const { result, failureMessage } = await getBackendPlugin().updateDocumentById(
      pathComponents.resourceId,
      documentInfo,
      body,
      {
        referenceValidation: event.headers['reference-validation'] !== 'false',
      },
      {
        ...newSecurity(),
        isOwnershipEnabled: jwtStatus.isOwnershipEnabled,
        clientName: jwtStatus.subject,
      },
      context.awsRequestId,
    );
    if (result === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(moduleName, context, 'update', 204);
      return { body: '', statusCode: 204, headers: headerMetadata };
    }
    if (result === 'UPDATE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, context, 'update', 404);
      return { body: '', statusCode: 404, headers: headerMetadata };
    }
    if (result === 'UPDATE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, context, 'update', 400, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 400, headers: headerMetadata };
    }
    writeDebugStatusToLog(moduleName, context, 'update', 500, failureMessage);
    return { body: JSON.stringify({ message: failureMessage ?? 'Failure' }), statusCode: 500, headers: headerMetadata };
  } catch (e) {
    writeErrorToLog(moduleName, context, event, 'update', 500, e);
    return { body: '', statusCode: 500 };
  }
}
