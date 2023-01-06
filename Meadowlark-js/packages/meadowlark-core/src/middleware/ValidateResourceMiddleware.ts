// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { validateResource } from '../validation/ResourceValidator';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';
import { NoResourceInfo } from '../model/ResourceInfo';

const moduleName = 'core.middleware.ValidateResourceMiddleware';

/**
 * Validates resource
 */
export async function resourceValidation({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'resourceValidation');

  const {
    resourceInfo,
    errorBody: error,
    headerMetadata,
  } = await validateResource(frontendRequest.middleware.pathComponents);

  if (error != null) {
    const statusCode = resourceInfo === NoResourceInfo ? 404 : 400;
    writeDebugStatusToLog(moduleName, frontendRequest, 'resourceValidation', statusCode, undefined, error);
    return { frontendRequest, frontendResponse: { body: error, statusCode, headers: headerMetadata } };
  }

  frontendRequest.middleware.resourceInfo = resourceInfo;
  frontendRequest.middleware.headerMetadata = headerMetadata;
  return { frontendRequest, frontendResponse: null };
}
