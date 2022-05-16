// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { validateResource } from '../validation/RequestValidator';
import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
import { PathComponents, pathComponentsFrom } from '../model/PathComponents';
import { documentIdForDocumentInfo } from '../model/DocumentId';
import { NoDocumentInfo } from '../model/DocumentInfo';
import { validateJwt } from '../security/JwtValidator';
import { newSecurity } from '../model/Security';
import { authorizationHeader } from '../security/AuthorizationHeader';
import { getDocumentStore } from '../plugin/PluginLoader';
import { afterUpdateDocumentById, beforeUpdateDocumentById } from '../plugin/listener/Publish';
import { UpdateRequest } from '../message/UpdateRequest';
import { UpdateResult } from '../message/UpdateResult';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

const moduleName = 'Update';

/**
 * Entry point for API update requests, which are "by id"
 *
 * Validates resource and JSON document shape, extracts keys and forwards to backend for update
 */
export async function update(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'update');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(frontendRequest));
    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as FrontendResponse;
    }

    const pathComponents: PathComponents | null = pathComponentsFrom(frontendRequest.path);
    if (pathComponents === null || pathComponents.resourceId == null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 404);
      return { body: '', statusCode: 404 };
    }

    if (frontendRequest.body == null) {
      const message = 'Missing body';
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    let body: any = {};
    try {
      body = JSON.parse(frontendRequest.body);
    } catch (error) {
      const message = 'Malformed body';
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    const { documentInfo, errorBody, headerMetadata } = await validateResource(pathComponents, body);
    if (errorBody !== null) {
      const statusCode = documentInfo === NoDocumentInfo ? 404 : 400;
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: headerMetadata };
    }

    const resourceIdFromBody = documentIdForDocumentInfo(documentInfo);
    if (resourceIdFromBody !== pathComponents.resourceId) {
      const failureMessage = 'The identity of the resource does not match the identity in the updated document.';
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 400, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 400, headers: headerMetadata };
    }

    const request: UpdateRequest = {
      id: pathComponents.resourceId,
      documentInfo,
      edfiDoc: body,
      validate: frontendRequest.headers['reference-validation'] !== 'false',
      security: {
        ...newSecurity(),
        isOwnershipEnabled: jwtStatus.isOwnershipEnabled,
        clientName: jwtStatus.subject,
      },
      traceId: frontendRequest.traceId,
    };

    beforeUpdateDocumentById(request);
    const result: UpdateResult = await getDocumentStore().updateDocumentById(request);
    afterUpdateDocumentById(request, result);

    const { response, failureMessage } = result;

    if (response === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 204);
      return { body: '', statusCode: 204, headers: headerMetadata };
    }
    if (response === 'UPDATE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 404);
      return { body: '', statusCode: 404, headers: headerMetadata };
    }
    if (response === 'UPDATE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 400, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 400, headers: headerMetadata };
    }
    writeDebugStatusToLog(moduleName, frontendRequest, 'update', 500, failureMessage);
    return { body: JSON.stringify({ message: failureMessage ?? 'Failure' }), statusCode: 500, headers: headerMetadata };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'update', 500, e);
    return { body: '', statusCode: 500 };
  }
}
