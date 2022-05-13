// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { validateRequest } from '../validation/RequestValidator';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareChain } from './MiddlewareChain';
import { NoDocumentInfo } from '../model/DocumentInfo';

const moduleName = 'ValidateResourceMiddleware';

/**
 * Validates resource, JSON document shape, and extracts identity information
 */
export async function validateResource({ frontendRequest, frontendResponse }: MiddlewareChain): Promise<MiddlewareChain> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'validateResource');

  const { documentInfo, errorBody, headerMetadata } = await validateRequest(
    frontendRequest.middleware.pathComponents,
    frontendRequest.middleware.parsedBody,
  );

  if (errorBody != null) {
    const statusCode = documentInfo === NoDocumentInfo ? 404 : 400;
    writeDebugStatusToLog(moduleName, frontendRequest, 'validateResource', statusCode, errorBody);
    return { frontendRequest, frontendResponse: { body: errorBody, statusCode, headers: headerMetadata } };
  }

  frontendRequest.middleware.documentInfo = documentInfo;
  frontendRequest.middleware.headerMetadata = headerMetadata;
  return { frontendRequest, frontendResponse: null };
}
