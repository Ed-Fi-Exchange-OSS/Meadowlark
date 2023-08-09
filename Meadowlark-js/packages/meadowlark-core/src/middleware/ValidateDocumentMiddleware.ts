// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { validateDocument } from '../validation/DocumentValidator';
import { writeDebugObject, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';

const moduleName = 'core.middleware.ValidateDocumentMiddleware';

/**
 * Validates JSON document shape
 */
export async function documentValidation({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  const isUpdate = frontendRequest.action === 'updateById';
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'documentValidation');
  const error: object | null = await validateDocument(
    frontendRequest.middleware.parsedBody,
    frontendRequest.middleware.matchingMetaEdModel,
    isUpdate,
  );

  if (error != null) {
    const statusCode = 400;
    writeDebugObject(moduleName, frontendRequest, 'documentValidation', statusCode, error);
    return {
      frontendRequest,
      frontendResponse: { body: error, statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }

  return { frontendRequest, frontendResponse: null };
}
