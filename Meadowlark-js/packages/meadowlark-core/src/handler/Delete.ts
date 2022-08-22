// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
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
 * Forwards to datastore backend for deletion
 */
export async function deleteIt(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'deleteIt');
    if (frontendRequest.middleware.pathComponents.resourceId == null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 404);
      return { body: '', statusCode: 404 };
    }

    const request: DeleteRequest = {
      id: frontendRequest.middleware.pathComponents.resourceId,
      resourceInfo: frontendRequest.middleware.resourceInfo,
      validate: frontendRequest.headers['reference-validation'] !== 'false',
      security: frontendRequest.middleware.security,
      traceId: frontendRequest.traceId,
    };

    await beforeDeleteDocumentById(request);
    const result: DeleteResult = await getDocumentStore().deleteDocumentById(request);
    await afterDeleteDocumentById(request, result);

    const { response, failureMessage } = result;

    if (response === 'DELETE_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 204);
      return { body: '', statusCode: 204, headers: frontendRequest.middleware.headerMetadata };
    }
    if (response === 'DELETE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 404);
      return { body: '', statusCode: 404, headers: frontendRequest.middleware.headerMetadata };
    }
    if (response === 'DELETE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 409, failureMessage);
      return {
        body: JSON.stringify({ message: failureMessage }),
        statusCode: 409,
        headers: frontendRequest.middleware.headerMetadata,
      };
    }
    writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 500, failureMessage);
    return {
      body: JSON.stringify({ message: failureMessage ?? 'Failure' }),
      statusCode: 500,
      headers: frontendRequest.middleware.headerMetadata,
    };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'deleteIt', 500, e);
    return { body: '', statusCode: 500 };
  }
}
