// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentUuid } from './IdTypes';
import { ProjectShortVersion } from './ProjectShortVersion';
import { EndpointName } from './api-schema/EndpointName';
import { ProjectNamespace } from './api-schema/ProjectNamespace';

/**
 * The important parts of the request URL in object form
 */
export type PathComponents = {
  /**
   * Shortened project version number e.g. "v3.3b"
   */
  projectShortVersion: ProjectShortVersion;

  /**
   * Project namespace, all lowercased
   */
  projectNamespace: ProjectNamespace;

  /**
   * Endpoint name, which has been decapitalized
   */
  endpointName: EndpointName;

  /**
   * The resource identifier, which is a document uuid
   */
  documentUuid?: DocumentUuid;
};

/**
 * Create a new PathComponents
 */
export function newPathComponents(): PathComponents {
  return {
    projectShortVersion: '' as ProjectShortVersion,
    projectNamespace: '' as ProjectNamespace,
    endpointName: '' as EndpointName,
  };
}

/**
 * The null object for PathComponents
 */
export const NoPathComponents: PathComponents = Object.freeze(newPathComponents());
