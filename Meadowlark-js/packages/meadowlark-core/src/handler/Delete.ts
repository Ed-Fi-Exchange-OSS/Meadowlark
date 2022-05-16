// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { validateResource } from '../validation/RequestValidator';
import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
import { PathComponents, pathComponentsFrom } from '../model/PathComponents';
import { NoDocumentInfo } from '../model/DocumentInfo';
import { validateJwt } from '../security/JwtValidator';
import { newSecurity } from '../model/Security';
import { authorizationHeader } from '../security/AuthorizationHeader';
import { getDocumentStore } from '../plugin/PluginLoader';
import { beforeDeleteDocumentById, afterDeleteDocumentById } from '../plugin/listener/Publish';
import { DeleteRequest } from '../message/DeleteRequest';
import { DeleteResult } from '../message/DeleteResult';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

const moduleName = 'Delete';

/**
 * Entry point for all API DELETE requests, which are "by id"
 *
 * Validates resource and forwards to backend for deletion
 */
export async function deleteIt(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'deleteIt');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(frontendRequest));
    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as FrontendResponse;
    }

    const pathComponents: PathComponents | null = pathComponentsFrom(frontendRequest.path);
    if (pathComponents === null || pathComponents.resourceId == null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 404);
      return { body: '', statusCode: 404 };
    }

    const { documentInfo, errorBody, headerMetadata } = await validateResource(pathComponents, null);
    if (errorBody !== null) {
      const statusCode = documentInfo === NoDocumentInfo ? 404 : 400;
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: headerMetadata };
    }

    const request: DeleteRequest = {
      id: pathComponents.resourceId,
      documentInfo,
      validate: frontendRequest.headers['reference-validation'] !== 'false',
      security: {
        ...newSecurity(),
        isOwnershipEnabled: jwtStatus.isOwnershipEnabled,
        clientName: jwtStatus.subject,
      },
      traceId: frontendRequest.traceId,
    };

    beforeDeleteDocumentById(request);
    const result: DeleteResult = await getDocumentStore().deleteDocumentById(request);
    afterDeleteDocumentById(request, result);

    const { response, failureMessage } = result;

    if (response === 'DELETE_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 204);
      return { body: '', statusCode: 204, headers: headerMetadata };
    }
    if (response === 'DELETE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 404);
      return { body: '', statusCode: 404, headers: headerMetadata };
    }
    if (response === 'DELETE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 409, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 409, headers: headerMetadata };
    }
    writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 500, failureMessage);
    return { body: JSON.stringify({ message: failureMessage ?? 'Failure' }), statusCode: 500, headers: headerMetadata };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'deleteIt', 500, e);
    return { body: '', statusCode: 500 };
  }
}
