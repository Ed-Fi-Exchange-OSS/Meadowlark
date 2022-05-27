// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { validateDocument } from '../validation/DocumentValidator';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';
import { NoDocumentInfo } from '../model/DocumentInfo';

const moduleName = 'ValidateDocumentMiddleware';

/**
 * Validates JSON document shape and extracts identity and reference information
 */
export async function documentValidation({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'validateResource');

  const { documentInfo, errorBody } = await validateDocument(
    frontendRequest.middleware.pathComponents,
    frontendRequest.middleware.resourceInfo,
    frontendRequest.middleware.parsedBody,
    frontendRequest.traceId,
  );

  if (errorBody != null) {
    const statusCode = documentInfo === NoDocumentInfo ? 404 : 400;
    writeDebugStatusToLog(moduleName, frontendRequest, 'validateResource', statusCode, errorBody);
    return {
      frontendRequest,
      frontendResponse: { body: errorBody, statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }

  frontendRequest.middleware.documentInfo = documentInfo;
  return { frontendRequest, frontendResponse: null };
}
