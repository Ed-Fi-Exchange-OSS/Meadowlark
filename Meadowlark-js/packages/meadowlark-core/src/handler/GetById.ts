// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getDocumentStore } from '../plugin/PluginLoader';
import { writeDebugStatusToLog } from '../Logger';
import { GetRequest } from '../message/GetRequest';
import { afterGetDocumentById, beforeGetDocumentById } from '../plugin/listener/Publish';
import { GetResult } from '../message/GetResult';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

const moduleName = 'core.handler.GetById';

/**
 * Handler for API "get by id" requests
 *
 * Forwards "get by id" request to datastore backend
 */
export async function getById(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  if (frontendRequest.middleware.pathComponents.resourceId == null) {
    writeDebugStatusToLog(moduleName, frontendRequest, 'getById', 404);
    return { statusCode: 404 };
  }
  const request: GetRequest = {
    id: frontendRequest.middleware.pathComponents.resourceId,
    resourceInfo: frontendRequest.middleware.resourceInfo,
    security: frontendRequest.middleware.security,
    traceId: frontendRequest.traceId,
  };

  await beforeGetDocumentById(request);
  const result: GetResult = await getDocumentStore().getDocumentById(request);
  await afterGetDocumentById(request, result);

  const { response, document } = result;

  if (response === 'UNKNOWN_FAILURE') {
    writeDebugStatusToLog(moduleName, frontendRequest, 'getById', 500);
    return { statusCode: 500, headers: frontendRequest.middleware.headerMetadata };
  }

  if (response === 'GET_FAILURE_NOT_EXISTS') {
    writeDebugStatusToLog(moduleName, frontendRequest, 'getById', 404);
    return {
      statusCode: 404,
      headers: frontendRequest.middleware.headerMetadata,
    };
  }

  writeDebugStatusToLog(moduleName, frontendRequest, 'getById', 200);
  return {
    body: document,
    statusCode: 200,
    headers: frontendRequest.middleware.headerMetadata,
  };
}
