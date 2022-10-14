// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger, writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';
import { findMetaEdModel } from '../metaed/MetaEdModelFinder';

const moduleName = 'FindMetaEdModelMiddleware';

/**
 * Finds the matching MetaEd model from the path components
 */
export async function metaEdModelFinding({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'metaEdModelFinding');

  const matchingMetaEdModel = await findMetaEdModel(frontendRequest.middleware.pathComponents);
  if (matchingMetaEdModel == null) {
    const errorMessage = `${moduleName}.metaEdModelFinding: Fatal error - matchingMetaEdModel not found`;
    Logger.error(errorMessage, frontendRequest.traceId);
    const statusCode = 500;
    writeDebugStatusToLog(moduleName, frontendRequest, 'metaEdModelFinding', statusCode, errorMessage);
    return {
      frontendRequest,
      frontendResponse: { body: '', statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }
  Logger.debug(
    `${moduleName}: Found matching MetaEd model ${matchingMetaEdModel.namespace}.${matchingMetaEdModel.metaEdName}`,
    frontendRequest.traceId,
  );

  frontendRequest.middleware.matchingMetaEdModel = matchingMetaEdModel;
  return { frontendRequest, frontendResponse: null };
}
