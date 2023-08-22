// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentUuid } from './IdTypes';

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
  resourceName: string;
  /**
   * The resource identifier, which is a document uuid
   */
  documentUuid?: DocumentUuid;
};

export function newPathComponents() {
  return {
    version: '',
    namespace: '',
    resourceName: '',
  };
}

export const NoPathComponents = Object.freeze(newPathComponents());
