// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { ProjectNameMapping } from './ProjectNameMapping';
import { ProjectSchemaMapping } from './ProjectSchemaMapping';

/**
 * API information
 */
export type ApiSchema = {
  /**
   * A collection of ProjectNamespaces mapped to ProjectSchema objects
   */
  projectSchemas: ProjectSchemaMapping;

  /**
   * A collection of MetaEdProjectNames mapped to ProjectNamespaces.
   */
  projectNameMapping: ProjectNameMapping;
};

export function newApiSchema(): ApiSchema {
  return { projectSchemas: {}, projectNameMapping: {} };
}

export const NoApiSchema: ApiSchema = Object.freeze(newApiSchema());
