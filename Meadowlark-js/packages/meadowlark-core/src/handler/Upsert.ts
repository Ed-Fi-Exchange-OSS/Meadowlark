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
import { UpsertRequest } from '../message/UpsertRequest';
import { afterUpsertDocument, beforeUpsertDocument } from '../plugin/listener/Publish';
import { UpsertResult } from '../message/UpsertResult';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

const moduleName = 'Create';

/**
 * Entry point for API upsert requests
 *
 * Validates resource and JSON document shape, extracts keys and forwards to backend for creation/update
 */
export async function upsert(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'create');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(frontendRequest));
    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'create', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as FrontendResponse;
    }

    const pathComponents: PathComponents | null = pathComponentsFrom(frontendRequest.path);

    if (pathComponents === null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'create', 404);
      return { body: '', statusCode: 404 };
    }

    if (frontendRequest.body == null) {
      const message = 'Missing body';
      writeDebugStatusToLog(moduleName, frontendRequest, 'create', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    let body: object = {};
    try {
      body = JSON.parse(frontendRequest.body);
    } catch (error) {
      const message = 'Malformed body';
      writeDebugStatusToLog(moduleName, frontendRequest, 'create', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    const { documentInfo, errorBody, headerMetadata } = await validateResource(pathComponents, body);
    if (errorBody != null) {
      const statusCode = documentInfo === NoDocumentInfo ? 404 : 400;
      writeDebugStatusToLog(moduleName, frontendRequest, 'create', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: headerMetadata };
    }

    const resourceId = documentIdForDocumentInfo(documentInfo);
    const request: UpsertRequest = {
      id: resourceId,
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

    beforeUpsertDocument(request);
    const result: UpsertResult = await getDocumentStore().upsertDocument(request);
    afterUpsertDocument(request, result);

    const { response, failureMessage } = result;

    if (response === 'INSERT_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'create', 201);
      const location = `${frontendRequest.path}${frontendRequest.path.endsWith('/') ? '' : '/'}${resourceId}`;
      return {
        body: '',
        statusCode: 201,
        headers: { ...headerMetadata, Location: location },
      };
    }
    if (response === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'create', 200);
      const location = `${frontendRequest.path}${frontendRequest.path.endsWith('/') ? '' : '/'}${resourceId}`;
      return { body: '', statusCode: 200, headers: { ...headerMetadata, Location: location } };
    }
    if (response === 'UPDATE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'create', 409);
      return { body: '', statusCode: 409, headers: headerMetadata };
    }
    if (response === 'INSERT_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'create', 400, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 400, headers: headerMetadata };
    }

    // Otherwise, it's a 500 error
    writeErrorToLog(moduleName, frontendRequest.traceId, 'create', 500, failureMessage);
    return { body: '', statusCode: 500, headers: headerMetadata };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'create', 500, e);
    return { body: '', statusCode: 500 };
  }
}
