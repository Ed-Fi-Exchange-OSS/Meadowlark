// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { isDocumentIdValid } from '../model/DocumentId';
import type { PathComponents } from '../model/PathComponents';
import type { MiddlewareChain } from './MiddlewareChain';

const moduleName = 'ParsePathMiddleware';

function pathComponentsFrom(path: string): PathComponents | null {
  // Matches all of the following sample expressions:
  // /v3.3b/ed-fi/Sections
  // /v3.3b/ed-fi/Sections/
  // /v3.3b/ed-fi/Sections/idValue
  const pathExpression = /\/(?<version>[^/]+)\/(?<namespace>[^/]+)\/(?<resource>[^/]+)(\/|$)((?<resourceId>[^/]*$))?/gm;
  const match = pathExpression.exec(path);

  if (match?.groups == null) {
    return null;
  }

  // Confirm that the id value is a properly formed document id
  const { resourceId } = match.groups ?? null;
  if (resourceId != null && !isDocumentIdValid(resourceId)) {
    return null;
  }
  return {
    version: match.groups.version,
    namespace: match.groups.namespace,
    endpointName: match.groups.resource,
    resourceId,
  };
}

/**
 * Handles path parsing
 */
export async function parsePath({ frontendRequest, frontendResponse }: MiddlewareChain): Promise<MiddlewareChain> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'parsePath');

  const pathComponents: PathComponents | null = pathComponentsFrom(frontendRequest.path);

  if (pathComponents === null) {
    writeDebugStatusToLog(moduleName, frontendRequest, 'parsePath', 404);
    return { frontendRequest, frontendResponse: { body: '', statusCode: 404 } };
  }

  frontendRequest.middleware.pathComponents = pathComponents;
  return { frontendRequest, frontendResponse: null };
}
