// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { isDocumentIdValidForResource } from '../validation/DocumentIdValidator';
import { MiddlewareModel } from './MiddlewareModel';

const moduleName = 'core.middleware.ValidateResourceIdMiddleware';

/**
 * Validates resource id against resource
 */
export async function resourceIdValidation({
  frontendRequest,
  frontendResponse,
}: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'resourceIdValidation');

  // If no resource id in request, there is nothing to validate
  if (frontendRequest.middleware.pathComponents.documentUuid == null) return { frontendRequest, frontendResponse: null };

  return { frontendRequest, frontendResponse: null };
}
