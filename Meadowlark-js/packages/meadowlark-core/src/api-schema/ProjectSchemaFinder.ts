// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import type { TraceId } from '../model/IdTypes';
import { NoProjectSchema, ProjectSchema } from '../model/api-schema/ProjectSchema';
import { ApiSchema } from '../model/api-schema/ApiSchema';
import { ProjectNamespace } from '../model/api-schema/ProjectNamespace';

/**
 * Finds the ProjectSchema that represents the given ProjectNamespace.
 */
export async function findProjectSchema(
  apiSchema: ApiSchema,
  projectNamespace: ProjectNamespace,
  traceId: TraceId,
): Promise<ProjectSchema> {
  const projectSchema: ProjectSchema | undefined = apiSchema.projectSchemas[projectNamespace];

  if (projectSchema == null) {
    Logger.warn(`findProjectSchema: projectNamespace '${projectNamespace}' does not exist in ApiSchema`, traceId);
    return NoProjectSchema;
  }
  return projectSchema;
}
