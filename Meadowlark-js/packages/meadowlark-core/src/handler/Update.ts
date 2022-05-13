// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
import { documentIdForDocumentInfo } from '../model/DocumentId';
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
 * Forwards to datastore backend for update
 */
export async function update(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'update');

    const resourceIdFromBody = documentIdForDocumentInfo(frontendRequest.middleware.documentInfo);
    if (resourceIdFromBody !== frontendRequest.middleware.pathComponents.resourceId) {
      const failureMessage = 'The identity of the resource does not match the identity in the updated document.';
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 400, failureMessage);
      return {
        body: JSON.stringify({ message: failureMessage }),
        statusCode: 400,
        headers: frontendRequest.middleware.headerMetadata,
      };
    }

    const request: UpdateRequest = {
      id: frontendRequest.middleware.pathComponents.resourceId,
      documentInfo: frontendRequest.middleware.documentInfo,
      edfiDoc: frontendRequest.middleware.parsedBody,
      validate: frontendRequest.headers['reference-validation'] !== 'false',
      security: frontendRequest.middleware.security,
      traceId: frontendRequest.traceId,
    };

    beforeUpdateDocumentById(request);
    const result: UpdateResult = await getDocumentStore().updateDocumentById(request);
    afterUpdateDocumentById(request, result);

    const { response, failureMessage } = result;

    if (response === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 204);
      return { body: '', statusCode: 204, headers: frontendRequest.middleware.headerMetadata };
    }
    if (response === 'UPDATE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 404);
      return { body: '', statusCode: 404, headers: frontendRequest.middleware.headerMetadata };
    }
    if (response === 'UPDATE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 400, failureMessage);
      return {
        body: JSON.stringify({ message: failureMessage }),
        statusCode: 400,
        headers: frontendRequest.middleware.headerMetadata,
      };
    }
    writeDebugStatusToLog(moduleName, frontendRequest, 'update', 500, failureMessage);
    return {
      body: JSON.stringify({ message: failureMessage ?? 'Failure' }),
      statusCode: 500,
      headers: frontendRequest.middleware.headerMetadata,
    };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'update', 500, e);
    return { body: '', statusCode: 500 };
  }
}
