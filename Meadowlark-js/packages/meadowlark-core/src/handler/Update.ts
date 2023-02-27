// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeErrorToLog } from '@edfi/meadowlark-utilities';
import R from 'ramda';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { meadowlarkIdForDocumentIdentity } from '../model/DocumentIdentity';
import { getDocumentStore } from '../plugin/PluginLoader';
import { afterUpdateDocumentById, beforeUpdateDocumentById } from '../plugin/listener/Publish';
import { UpdateRequest } from '../message/UpdateRequest';
import { UpdateResult } from '../message/UpdateResult';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';
import { blockingDocumentsToUris } from './UriBuilder';
import { TraceId } from '../model/BrandedTypes';

const moduleName = 'core.handler.Update';

/**
 * Entry point for API update requests, which are "by id"
 *
 * Forwards to datastore backend for update
 */
export async function update(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'update');
    const { resourceInfo, documentInfo, pathComponents, headerMetadata, parsedBody, security } = frontendRequest.middleware;

    // Update must include the resourceId
    if (pathComponents.documentUuid == null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 400);
      return { statusCode: 400, headers: headerMetadata };
    }

    const request: UpdateRequest = {
      meadowlarkId: meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity),
      documentUuid: pathComponents.documentUuid,
      resourceInfo,
      documentInfo,
      edfiDoc: parsedBody,
      validate: frontendRequest.middleware.validateResources,
      security,
      traceId: frontendRequest.traceId as TraceId,
    };

    await beforeUpdateDocumentById(request);
    const result: UpdateResult = await getDocumentStore().updateDocumentById(request);
    await afterUpdateDocumentById(request, result);

    const { response, failureMessage } = result;

    if (response === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 204);
      return { statusCode: 204, headers: headerMetadata };
    }

    if (response === 'UPDATE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 404);
      return { statusCode: 404, headers: headerMetadata };
    }

    if (response === 'UPDATE_FAILURE_REFERENCE') {
      const blockingUris: string[] = blockingDocumentsToUris(frontendRequest, result.blockingDocuments);
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 409, 'reference error');
      return {
        body: R.is(String, failureMessage) ? { error: failureMessage, blockingUris } : failureMessage,
        statusCode: 409,
        headers: headerMetadata,
      };
    }

    writeErrorToLog(moduleName, frontendRequest.traceId, 'update', 500, failureMessage);

    return {
      statusCode: 500,
      headers: headerMetadata,
    };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'update', 500, e);
    return { statusCode: 500 };
  }
}
