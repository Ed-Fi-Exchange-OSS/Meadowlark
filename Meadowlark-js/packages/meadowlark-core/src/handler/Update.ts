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

const moduleName = 'core.handler.Update';

type MaybeHasIdField = { id: string | undefined };

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
    const documentUuidFromBody = (parsedBody as MaybeHasIdField).id;
    if (documentUuidFromBody !== pathComponents.documentUuid) {
      const failureMessage = 'The identity of the resource does not match the identity in the updated document.';
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 400, failureMessage);

      return {
        body: {
          error: {
            message: failureMessage,
          },
        },
        statusCode: 400,
        headers: headerMetadata,
      };
    }
    const request: UpdateRequest = {
      meadowlarkId: meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity),
      documentUuid: pathComponents.documentUuid,
      resourceInfo,
      documentInfo,
      edfiDoc: parsedBody,
      validateDocumentReferencesExist: frontendRequest.middleware.validateResources,
      security,
      traceId: frontendRequest.traceId,
    };

    await beforeUpdateDocumentById(request);
    const result: UpdateResult = await getDocumentStore().updateDocumentById(request);
    await afterUpdateDocumentById(request, result);

    const { response } = result;

    if (response === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 204);
      return { statusCode: 204, headers: headerMetadata };
    }

    if (response === 'UPDATE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 404);
      return { statusCode: 404, headers: headerMetadata };
    }

    if (response === 'UPDATE_FAILURE_REFERENCE') {
      const blockingUris: string[] = blockingDocumentsToUris(frontendRequest, result.referringDocumentInfo);
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 409, 'reference error');
      return {
        body: R.is(String, result.failureMessage) ? { error: result.failureMessage, blockingUris } : result.failureMessage,
        statusCode: 409,
        headers: headerMetadata,
      };
    }

    if (response === 'UPDATE_CASCADE_REQUIRED') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 409, 'update cascade required');
      return {
        body: {
          error: {
            message:
              'This operation would change the identity of the document and require a cascading update of referencing documents. Not supported at this time.',
          },
        },
        statusCode: 409,
        headers: headerMetadata,
      };
    }

    if (response === 'UPDATE_FAILURE_IMMUTABLE_IDENTITY') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 400, 'modify immutable identity error');
      return {
        body: { error: { message: 'The identity fields of the document cannot be modified' } },
        statusCode: 400,
        headers: headerMetadata,
      };
    }

    if (response === 'UPDATE_FAILURE_CONFLICT') {
      const blockingUris: string[] = blockingDocumentsToUris(frontendRequest, result.referringDocumentInfo);
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 409, blockingUris.join(','));
      return {
        body: { error: { message: result.failureMessage ?? '', blockingUris } },
        statusCode: 409,
        headers: headerMetadata,
      };
    }

    if (response === 'UPDATE_FAILURE_WRITE_CONFLICT') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'update', 409);
      return {
        statusCode: 409,
        headers: headerMetadata,
        body: R.is(String, result.failureMessage) ? { error: result.failureMessage } : result.failureMessage,
      };
    }

    writeErrorToLog(moduleName, frontendRequest.traceId, 'update', 500, result.failureMessage);

    return {
      statusCode: 500,
      headers: headerMetadata,
    };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'update', 500, e);
    return { statusCode: 500 };
  }
}
