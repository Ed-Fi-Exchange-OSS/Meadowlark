// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
import { documentIdForDocumentInfo } from '../model/DocumentInfo';
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
    const { resourceInfo, documentInfo, pathComponents, headerMetadata, parsedBody, security } = frontendRequest.middleware;

    const resourceIdFromBody = documentIdForDocumentInfo(resourceInfo, documentInfo);
    if (resourceIdFromBody !== pathComponents.resourceId) {
      const failureMessage = 'The identity of the resource does not match the identity in the updated document.';
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 400, failureMessage);

      return {
        body: JSON.stringify({ message: failureMessage }),
        statusCode: 400,
        headers: headerMetadata,
      };
    }

    const request: UpdateRequest = {
      id: pathComponents.resourceId,
      resourceInfo,
      documentInfo,
      edfiDoc: parsedBody,
      validate: frontendRequest.headers['reference-validation'] !== 'false',
      security,
      traceId: frontendRequest.traceId,
    };

    await beforeUpdateDocumentById(request);
    const result: UpdateResult = await getDocumentStore().updateDocumentById(request);
    await afterUpdateDocumentById(request, result);

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
      return {
        body: JSON.stringify({ message: failureMessage }),
        statusCode: 400,
        headers: headerMetadata,
      };
    }

    writeDebugStatusToLog(moduleName, frontendRequest, 'update', 500, failureMessage);

    return {
      body: JSON.stringify({ message: failureMessage ?? 'Failure' }),
      statusCode: 500,
      headers: headerMetadata,
    };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'update', 500, e);
    return { body: '', statusCode: 500 };
  }
}
