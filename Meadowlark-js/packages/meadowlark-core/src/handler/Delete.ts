// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { isDebugEnabled, writeErrorToLog } from '@edfi/meadowlark-utilities';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { getDocumentStore } from '../plugin/PluginLoader';
import { beforeDeleteDocumentById, afterDeleteDocumentById } from '../plugin/listener/Publish';
import { DeleteRequest } from '../message/DeleteRequest';
import { DeleteResult } from '../message/DeleteResult';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';
import { blockingDocumentsToUris } from './UriBuilder';

const moduleName = 'core.handler.Delete';

const DELETE_FAILURE_REFERENCE_MESSAGE: string =
  'The resource cannot be deleted because it is a dependency of other documents';

/**
 * Entry point for all API DELETE requests, which are "by id"
 *
 * Forwards to datastore backend for deletion
 */
export async function deleteIt(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'deleteIt');

    if (frontendRequest.middleware.pathComponents.documentUuid == null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 404);
      return { statusCode: 404 };
    }

    const request: DeleteRequest = {
      documentUuid: frontendRequest.middleware.pathComponents.documentUuid,
      resourceInfo: frontendRequest.middleware.resourceInfo,
      validateNoReferencesToDocument: frontendRequest.middleware.validateResources,
      security: frontendRequest.middleware.security,
      traceId: frontendRequest.traceId,
    };

    await beforeDeleteDocumentById(request);
    const result: DeleteResult = await getDocumentStore().deleteDocumentById(request);
    await afterDeleteDocumentById(request, result);

    if (result.response === 'DELETE_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 204);
      return { statusCode: 204, headers: frontendRequest.middleware.headerMetadata };
    }

    if (result.response === 'DELETE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 404);
      return { statusCode: 404, headers: frontendRequest.middleware.headerMetadata };
    }

    if (result.response === 'DELETE_FAILURE_REFERENCE') {
      const blockingUris: string[] = blockingDocumentsToUris(frontendRequest, result.referringDocumentInfo);

      if (isDebugEnabled()) {
        writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 409, blockingUris.join(','));
      }

      return {
        body: { error: { message: DELETE_FAILURE_REFERENCE_MESSAGE, blockingUris } },
        statusCode: 409,
        headers: frontendRequest.middleware.headerMetadata,
      };
    }

    if (result.response === 'DELETE_FAILURE_WRITE_CONFLICT') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 404);
      return {
        statusCode: 404,
        headers: frontendRequest.middleware.headerMetadata,
        body: R.is(String, result.failureMessage) ? { error: result.failureMessage } : result.failureMessage,
      };
    }

    writeErrorToLog(moduleName, frontendRequest.traceId, 'deleteIt', 500, result.failureMessage);
    return {
      statusCode: 500,
      headers: frontendRequest.middleware.headerMetadata,
    };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'deleteIt', 500, e);
    return { statusCode: 500 };
  }
}
