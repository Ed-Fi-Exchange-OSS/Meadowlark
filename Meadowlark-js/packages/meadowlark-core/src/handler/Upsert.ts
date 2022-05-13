// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
import { documentIdForDocumentInfo } from '../model/DocumentId';
import { getDocumentStore } from '../plugin/PluginLoader';
import { UpsertRequest } from '../message/UpsertRequest';
import { afterUpsertDocument, beforeUpsertDocument } from '../plugin/listener/Publish';
import { UpsertResult } from '../message/UpsertResult';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

const moduleName = 'Upsert';

/**
 * Entry point for API upsert requests
 *
 * Forwards to backend for creation/update
 */
export async function upsert(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'upsert');

    const resourceId = documentIdForDocumentInfo(frontendRequest.middleware.documentInfo);
    const request: UpsertRequest = {
      id: resourceId,
      documentInfo: frontendRequest.middleware.documentInfo,
      edfiDoc: frontendRequest.middleware.parsedBody,
      validate: frontendRequest.headers['reference-validation'] !== 'false',
      security: frontendRequest.middleware.security,
      traceId: frontendRequest.traceId,
    };

    beforeUpsertDocument(request);
    const result: UpsertResult = await getDocumentStore().upsertDocument(request);
    afterUpsertDocument(request, result);

    const { response, failureMessage } = result;

    if (response === 'INSERT_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'upsert', 201);
      const { pathComponents } = frontendRequest.middleware;
      const location = `/${pathComponents.version}/${pathComponents.namespace}/${pathComponents.endpointName}/${resourceId}`;
      return {
        body: '',
        statusCode: 201,
        headers: { ...frontendRequest.middleware.headerMetadata, Location: location },
      };
    }
    if (response === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'upsert', 200);
      const { pathComponents } = frontendRequest.middleware;
      const location = `/${pathComponents.version}/${pathComponents.namespace}/${pathComponents.endpointName}/${resourceId}`;
      return { body: '', statusCode: 200, headers: { ...frontendRequest.middleware.headerMetadata, Location: location } };
    }
    if (response === 'UPDATE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'upsert', 409);
      return { body: '', statusCode: 409, headers: frontendRequest.middleware.headerMetadata };
    }
    if (response === 'INSERT_FAILURE_REFERENCE') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'upsert', 400, failureMessage);
      return {
        body: JSON.stringify({ message: failureMessage }),
        statusCode: 400,
        headers: frontendRequest.middleware.headerMetadata,
      };
    }

    // Otherwise, it's a 500 error
    writeErrorToLog(moduleName, frontendRequest.traceId, 'upsert', 500, failureMessage);
    return { body: '', statusCode: 500, headers: frontendRequest.middleware.headerMetadata };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'upsert', 500, e);
    return { body: '', statusCode: 500 };
  }
}
