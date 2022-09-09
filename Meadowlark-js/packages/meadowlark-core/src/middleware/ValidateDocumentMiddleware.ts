// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { validateDocument } from '../validation/DocumentValidator';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';

const moduleName = 'ValidateDocumentMiddleware';

/**
 * Validates JSON document shape
 */
export async function documentValidation({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'documentValidation');

  const errorBody: string = await validateDocument(
    frontendRequest.middleware.parsedBody,
    frontendRequest.middleware.matchingMetaEdModel,
  );

  if (errorBody !== '') {
    const statusCode = 400;
    writeDebugStatusToLog(moduleName, frontendRequest, 'documentValidation', statusCode, errorBody);
    return {
      frontendRequest,
      frontendResponse: { body: errorBody, statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }

  return { frontendRequest, frontendResponse: null };
}
