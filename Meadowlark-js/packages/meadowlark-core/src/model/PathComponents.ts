// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { isDocumentIdValid } from './DocumentId';

export type PathComponents = {
  /**
   * Data standard version number
   */
  version: string;
  /**
   * Data standard namespace
   */
  namespace: string;
  /**
   * Endpoint name (resource)
   */
  endpointName: string;
  /**
   * Resource identifier
   */
  resourceId: string | null;
};

export function pathComponentsFrom(path: string): PathComponents | null {
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
