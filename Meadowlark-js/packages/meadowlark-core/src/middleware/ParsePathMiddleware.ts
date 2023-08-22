// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { isDocumentUuidWellFormed } from '../model/DocumentIdentity';
import type { PathComponents } from '../model/PathComponents';
import type { DocumentUuid } from '../model/IdTypes';
import type { MiddlewareModel } from './MiddlewareModel';

const moduleName = 'core.middleware.ParsePathMiddleware';

export function pathComponentsFrom(path: string): PathComponents | null {
  // Matches all of the following sample expressions:
  // /v3.3b/ed-fi/Sections
  // /v3.3b/ed-fi/Sections/
  // /v3.3b/ed-fi/Sections/idValue
  const pathExpression = /\/(?<version>[^/]+)\/(?<namespace>[^/]+)\/(?<resource>[^/]+)(\/|$)((?<documentUuid>[^/]*$))?/gm;
  const match = pathExpression.exec(path);

  if (match?.groups == null) {
    return null;
  }

  const { documentUuid } = match.groups ?? null;

  return {
    version: match.groups.version,
    namespace: match.groups.namespace,
    resourceName: match.groups.resource,
    documentUuid: documentUuid as DocumentUuid,
  };
}

/**
 * Handles path parsing
 */
export async function parsePath({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'parsePath');

  const pathComponents: PathComponents | null = pathComponentsFrom(frontendRequest.path);

  if (pathComponents === null) {
    writeDebugStatusToLog(moduleName, frontendRequest, 'parsePath', 404);
    return { frontendRequest, frontendResponse: { statusCode: 404 } };
  }

  const { documentUuid } = pathComponents;
  if (documentUuid != null && !isDocumentUuidWellFormed(documentUuid)) {
    writeDebugStatusToLog(moduleName, frontendRequest, 'parsePath', 404, `Malformed resource id ${documentUuid}`);
    return { frontendRequest, frontendResponse: { statusCode: 404 } };
  }

  frontendRequest.middleware.pathComponents = pathComponents;
  return { frontendRequest, frontendResponse: null };
}
