// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeRequestToLog } from '../Logger';
import { findApiSchema } from '../api-schema/ApiSchemaLoader';
import type { MiddlewareModel } from './MiddlewareModel';

const moduleName = 'core.middleware.TimestampRequestMiddleware';

/**
 * Creates a timestamp for the request. Can be used to total order inserts/updates when used in conjunction with the
 * backend rejection of inserts/updates that do not provide an increasing timestamp.
 */
export async function loadApiSchema({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'loadApiSchema');

  frontendRequest.middleware.apiSchema = await findApiSchema(frontendRequest.traceId);
  return { frontendRequest, frontendResponse: null };
}
