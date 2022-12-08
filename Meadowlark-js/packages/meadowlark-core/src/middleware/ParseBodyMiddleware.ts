// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';

const moduleName = 'core.middleware.ParseBodyMiddleware';

/**
 * Handles initial body validation and parsing
 */
export async function parseBody({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'parseBody');

  if (frontendRequest.body == null) {
    const message = 'Missing body';
    writeDebugStatusToLog(moduleName, frontendRequest, 'parseBody', 400, message);
    return { frontendRequest, frontendResponse: { body: JSON.stringify({ message }), statusCode: 400 } };
  }

  let body: object = {};
  try {
    body = JSON.parse(frontendRequest.body);
  } catch (error) {
    const message = `Malformed body: ${error.message}`;
    writeDebugStatusToLog(moduleName, frontendRequest, 'parseBody', 400, message);
    return { frontendRequest, frontendResponse: { body: JSON.stringify({ message }), statusCode: 400 } };
  }

  frontendRequest.middleware.parsedBody = body;
  return { frontendRequest, frontendResponse: null };
}
