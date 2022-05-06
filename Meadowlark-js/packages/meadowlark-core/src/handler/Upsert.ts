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

const moduleName = 'Create';

/**
 * Entry point for API POST requests
 *
 * Validates resource and JSON document shape, extracts keys and forwards to backend for creation/update
 */
export async function upsert(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    writeRequestToLog(moduleName, event, context, 'create');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(event));
    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, context, 'create', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as APIGatewayProxyResult;
    }

    const pathComponents: PathComponents | null = pathComponentsFrom(event.path);

    if (pathComponents === null) {
      writeDebugStatusToLog(moduleName, context, 'create', 404);
      return { body: '', statusCode: 404 };
    }

    if (event.body == null) {
      const message = 'Missing body';
      writeDebugStatusToLog(moduleName, context, 'create', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    let body: object = {};
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      const message = 'Malformed body';
      writeDebugStatusToLog(moduleName, context, 'create', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    const { documentInfo, errorBody, headerMetadata } = await validateResource(pathComponents, body);
    if (errorBody != null) {
      const statusCode = documentInfo === NoDocumentInfo ? 404 : 400;
      writeDebugStatusToLog(moduleName, context, 'create', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: headerMetadata };
    }

    const resourceId = documentIdForDocumentInfo(documentInfo);
    const { result, failureMessage } = await getBackendPlugin().upsertDocument(
      resourceId,
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
    if (result === 'INSERT_SUCCESS') {
      writeDebugStatusToLog(moduleName, context, 'create', 201);
      const location = `${event.path}${event.path.endsWith('/') ? '' : '/'}${resourceId}`;
      return {
        body: '',
        statusCode: 201,
        headers: { ...headerMetadata, Location: location },
      };
    }
    if (result === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(moduleName, context, 'create', 200);
      const location = `${event.path}${event.path.endsWith('/') ? '' : '/'}${resourceId}`;
      return { body: '', statusCode: 200, headers: { ...headerMetadata, Location: location } };
    }
    if (result === 'UPDATE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, context, 'create', 409);
      return { body: '', statusCode: 409, headers: headerMetadata };
    }
    if (result === 'INSERT_FAILURE_REFERENCE' || result === 'INSERT_FAILURE_ASSIGNABLE_COLLISION') {
      writeDebugStatusToLog(moduleName, context, 'create', 400, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 400, headers: headerMetadata };
    }

    // Otherwise, it's a 500 error
    writeErrorToLog(moduleName, context, event, 'create', 500, failureMessage);
    return { body: '', statusCode: 500, headers: headerMetadata };
  } catch (e) {
    writeErrorToLog(moduleName, context, event, 'create', 500, e);
    return { body: '', statusCode: 500 };
  }
}
