// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import path from 'path';
import fs from 'fs-extra';
import { NoProjectSchema, ProjectSchema } from '../model/api-schema/ProjectSchema';
import { writeDebugMessage, writeErrorToLog } from '../Logger';
import type { ApiSchema } from '../model/api-schema/ApiSchema';
import { TraceId } from '../model/IdTypes';
import { EndpointName } from '../model/api-schema/EndpointName';
import { ProjectNamespace } from '../model/api-schema/ProjectNamespace';
import { ProjectShortVersion } from '../model/ProjectShortVersion';

const moduleName = 'LoadProjectSchema';

const dataStandard33bPath: string = path.resolve(__dirname, '../ds-schemas/DataStandard-3.3.1-b.json');
const dataStandard50pre1Path: string = path.resolve(__dirname, '../ds-schemas/DataStandard-5.0.0-pre.1.json');

const projectNamespaceEdfi: ProjectNamespace = 'ed-fi' as ProjectNamespace;

const projectShortVersion33b: ProjectShortVersion = 'v3.3b' as ProjectShortVersion;
const projectShortVersion50pre1: ProjectShortVersion = 'v5.0-pre.1' as ProjectShortVersion;

/**
 * This is a simple cache implementation that works in Lambdas, see: https://rewind.io/blog/simple-caching-in-aws-lambda-functions/
 */
const projectSchemaCache = {};

function cacheKeyFrom(projectNamespace: ProjectNamespace, projectShortVersion: ProjectShortVersion): string {
  return `${projectNamespace}|${projectShortVersion}`;
}

function setProjectSchemaInCache(
  projectNamespace: ProjectNamespace,
  projectShortVersion: ProjectShortVersion,
  apiSchema: ProjectSchema,
) {
  projectSchemaCache[cacheKeyFrom(projectNamespace, projectShortVersion)] = apiSchema;
}

function getProjectSchemaFromCache(
  projectNamespace: ProjectNamespace,
  projectShortVersion: ProjectShortVersion,
): ProjectSchema | undefined {
  return projectSchemaCache[cacheKeyFrom(projectNamespace, projectShortVersion)];
}

/**
 * Loads ProjectSchema from an ApiSchema JSON file
 */
async function loadProjectSchemaFromFile(
  projectNamespace: ProjectNamespace,
  projectShortVersion: ProjectShortVersion,
  filePath: string,
  traceId: TraceId,
): Promise<ProjectSchema> {
  const projectSchema: ProjectSchema = ((await fs.readJson(filePath)) as ApiSchema).projectSchemas[projectNamespace];
  setProjectSchemaInCache(projectNamespace, projectShortVersion, projectSchema);
  writeDebugMessage(moduleName, 'loadProjectSchema', traceId, `Loading ApiSchema from ${filePath}`);
  return projectSchema;
}

/**
 * Entry point for loading ProjectSchemas from a file
 */
export async function findProjectSchema(
  projectNamespace: ProjectNamespace,
  projectShortVersion: ProjectShortVersion,
  traceId: TraceId,
): Promise<ProjectSchema> {
  const cachedProjectSchema: ProjectSchema | undefined = getProjectSchemaFromCache(projectNamespace, projectShortVersion);
  if (cachedProjectSchema != null) return cachedProjectSchema;

  // Only supporting data standards right now
  if (projectNamespace !== projectNamespaceEdfi) {
    writeDebugMessage(moduleName, 'getProjectSchema', traceId, `Namespace ${projectNamespace} on URL is unknown.`);
    return NoProjectSchema;
  }

  try {
    if (projectShortVersion === projectShortVersion33b) {
      return await loadProjectSchemaFromFile(projectNamespaceEdfi, projectShortVersion33b, dataStandard33bPath, traceId);
    }
    if (projectShortVersion === projectShortVersion50pre1) {
      return await loadProjectSchemaFromFile(
        projectNamespaceEdfi,
        projectShortVersion50pre1,
        dataStandard50pre1Path,
        traceId,
      );
    }

    writeDebugMessage(moduleName, 'getProjectSchema', traceId, `Version ${projectShortVersion} on URL is unknown.`);
  } catch (e) {
    writeErrorToLog(moduleName, traceId, 'getProjectSchema', e);
  }
  return NoProjectSchema;
}

/**
 * Returns a list of the valid endpoint names for a ProjectSchema.
 */
export function validEndpointNamesFor(
  projectNamespace: ProjectNamespace,
  projectShortVersion: ProjectShortVersion,
): EndpointName[] {
  const projectSchema: ProjectSchema | undefined = getProjectSchemaFromCache(projectNamespace, projectShortVersion);
  if (projectSchema == null) return [];
  return Object.keys(projectSchema.resourceSchemas) as EndpointName[];
}
