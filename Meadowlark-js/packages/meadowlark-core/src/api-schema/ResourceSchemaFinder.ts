// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PathComponents } from '../model/PathComponents';
import type { ResourceSchema } from '../model/api-schema/ResourceSchema';
import type { TraceId } from '../model/IdTypes';
import { ProjectSchema } from '../model/api-schema/ProjectSchema';
import { ApiSchema } from '../model/api-schema/ApiSchema';
import { findProjectSchema } from './ProjectSchemaFinder';

/**
 * Finds the ResourceSchema that represents the given REST resource path.
 */
export async function findResourceSchema(
  apiSchema: ApiSchema,
  pathComponents: PathComponents,
  traceId: TraceId,
): Promise<ResourceSchema | undefined> {
  const projectSchema: ProjectSchema = await findProjectSchema(apiSchema, pathComponents.projectNamespace, traceId);
  return projectSchema.resourceSchemas[pathComponents.endpointName];
}
