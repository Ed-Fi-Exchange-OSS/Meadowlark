// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { ResourceSchema } from './ResourceSchema';
import { ResourceSchemaMapping } from './ResourceSchemaMapping';
import { SemVer } from './SemVer';

/**
 * API project information
 */
export type ProjectSchema = {
  /**
   * The MetaEd project name the referenced API resource is defined in e.g. "EdFi" for a data standard entity.
   */
  projectName: string;
  projectVersion: SemVer;
  isExtensionProject: boolean;
  description: string;

  /**
   * A collection of EndpointNames mapped to ResourceSchema objects.
   */
  resourceSchemas: ResourceSchemaMapping;

  /**
   * SchoolYearEnumeration is not a resource but has a ResourceSchema
   */
  schoolYearEnumeration?: ResourceSchema;
};

export const NoProjectSchema: ProjectSchema = {
  projectName: 'NoProjectName',
  projectVersion: '0.0.0' as SemVer,
  isExtensionProject: false,
  description: 'NoProjectSchema',
  resourceSchemas: {},
};
