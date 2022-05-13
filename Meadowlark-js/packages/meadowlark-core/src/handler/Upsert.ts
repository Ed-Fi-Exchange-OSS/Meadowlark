// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { validateResource } from '../validation/RequestValidator';
import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
import { PathComponents, pathComponentsFrom } from '../model/PathComponents';
import { documentIdForDocumentInfo } from '../model/DocumentId';
import { NoDocumentInfo } from '../model/DocumentInfo';
import { validateJwt } from '../security/JwtValidator';
import { newSecurity } from '../model/Security';
import { authorizationHeader } from '../security/AuthorizationHeader';
import { getDocumentStore } from '../plugin/PluginLoader';
import { UpsertRequest } from '../message/UpsertRequest';
import { afterUpsertDocument, beforeUpsertDocument } from '../plugin/listener/Publish';
import { UpsertResult } from '../message/UpsertResult';

const moduleName = 'Create';

/**
 * Entry point for API upsert requests
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
    const request: UpsertRequest = {
      id: resourceId,
      documentInfo,
      edfiDoc: body,
      validate: event.headers['reference-validation'] !== 'false',
      security: {
        ...newSecurity(),
        isOwnershipEnabled: jwtStatus.isOwnershipEnabled,
        clientName: jwtStatus.subject,
      },
      traceId: context.awsRequestId,
    };

    beforeUpsertDocument(request);
    const result: UpsertResult = await getDocumentStore().upsertDocument(request);
    afterUpsertDocument(request, result);

    const { response, failureMessage } = result;

    if (response === 'INSERT_SUCCESS') {
      writeDebugStatusToLog(moduleName, context, 'create', 201);
      const location = `${event.path}${event.path.endsWith('/') ? '' : '/'}${resourceId}`;
      return {
        body: '',
        statusCode: 201,
        headers: { ...headerMetadata, Location: location },
      };
    }
    if (response === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(moduleName, context, 'create', 200);
      const location = `${event.path}${event.path.endsWith('/') ? '' : '/'}${resourceId}`;
      return { body: '', statusCode: 200, headers: { ...headerMetadata, Location: location } };
    }
    if (response === 'UPDATE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, context, 'create', 409);
      return { body: '', statusCode: 409, headers: headerMetadata };
    }
    if (response === 'INSERT_FAILURE_REFERENCE') {
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
