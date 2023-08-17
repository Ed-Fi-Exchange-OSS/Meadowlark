// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { LOCATION_HEADER_NAME, writeErrorToLog } from '@edfi/meadowlark-utilities';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { getDocumentStore } from '../plugin/PluginLoader';
import { afterUpsertDocument, beforeUpsertDocument } from '../plugin/listener/Publish';
import type { UpsertRequest } from '../message/UpsertRequest';
import type { UpsertResult } from '../message/UpsertResult';
import type { FrontendRequest } from './FrontendRequest';
import type { FrontendResponse } from './FrontendResponse';
import { blockingDocumentsToUris, resourceUriFrom } from './UriBuilder';
import { meadowlarkIdForDocumentIdentity } from '../model/DocumentIdentity';

const moduleName = 'core.handler.Upsert';

/**
 * Entry point for API upsert requests
 *
 * Forwards to backend for creation/update
 */
export async function upsert(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'upsert');
    const { resourceInfo, documentInfo, pathComponents, headerMetadata, parsedBody, security } = frontendRequest.middleware;

    const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);
    const request: UpsertRequest = {
      meadowlarkId,
      resourceInfo,
      documentInfo,
      edfiDoc: parsedBody,
      validateDocumentReferencesExist: frontendRequest.middleware.validateResources,
      security,
      traceId: frontendRequest.traceId,
    };

    await beforeUpsertDocument(request);
    const result: UpsertResult = await getDocumentStore().upsertDocument(request);
    await afterUpsertDocument(request, result);

    const { response, failureMessage } = result;

    if (response === 'INSERT_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'upsert', 201);
      return {
        statusCode: 201,
        headers: { ...headerMetadata, [LOCATION_HEADER_NAME]: resourceUriFrom(pathComponents, result.newDocumentUuid) },
      };
    }

    if (response === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'upsert', 200);
      return {
        statusCode: 200,
        headers: { ...headerMetadata, [LOCATION_HEADER_NAME]: resourceUriFrom(pathComponents, result.existingDocumentUuid) },
      };
    }

    if (response === 'UPDATE_FAILURE_REFERENCE') {
      const blockingUris: string[] = blockingDocumentsToUris(frontendRequest, result.referringDocumentInfo);
      writeDebugStatusToLog(moduleName, frontendRequest, 'upsert', 409, blockingUris.join(','));
      return {
        // body: { error: { message: failureMessage, blockingUris } },
        body: R.is(String, failureMessage) ? { error: failureMessage, blockingUris } : failureMessage,
        statusCode: 409,
        headers: headerMetadata,
      };
    }

    if (response === 'INSERT_FAILURE_REFERENCE' || response === 'INSERT_FAILURE_CONFLICT') {
      const blockingUris: string[] = blockingDocumentsToUris(frontendRequest, result.referringDocumentInfo);
      writeDebugStatusToLog(moduleName, frontendRequest, 'upsert', 409, blockingUris.join(','));
      return {
        body: R.is(String, failureMessage) ? { error: failureMessage, blockingUris } : failureMessage,
        statusCode: 409,
        headers: headerMetadata,
      };
    }

    if (response === 'UPSERT_FAILURE_WRITE_CONFLICT') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'upsert', 409);
      return {
        statusCode: 409,
        headers: headerMetadata,
        body: R.is(String, failureMessage) ? { error: failureMessage } : failureMessage,
      };
    }

    // Otherwise, it's a 500 error
    writeErrorToLog(moduleName, frontendRequest.traceId, 'upsert', 500, failureMessage);
    return { statusCode: 500, headers: headerMetadata };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'upsert', 500, e);
    return { statusCode: 500 };
  }
}
