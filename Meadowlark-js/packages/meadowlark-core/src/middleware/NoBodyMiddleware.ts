// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeRequestToLog } from '../Logger';
import { MiddlewareChain } from './MiddlewareChain';

const moduleName = 'NoBodyMiddleware';

/**
 * Creates empty body. For methods that don't expect one.
 */
export async function noBody({ frontendRequest, frontendResponse }: MiddlewareChain): Promise<MiddlewareChain> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'noBody');

  frontendRequest.middleware.parsedBody = {};
  return { frontendRequest, frontendResponse: null };
}
