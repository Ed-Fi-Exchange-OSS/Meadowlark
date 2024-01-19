// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import path from 'path';
import fs from 'fs-extra';
import { writeDebugMessage, writeErrorToLog } from '../Logger';
import { ApiSchema, NoApiSchema } from '../model/api-schema/ApiSchema';
import { TraceId } from '../model/IdTypes';
import { ProjectNamespace } from '../model/api-schema/ProjectNamespace';

const moduleName = 'ApiSchemaFinder';

const dataStandard33bPath: string = path.resolve(__dirname, '../ds-schemas/DataStandard-3.3.1-b.json');
// const dataStandard50Path: string = path.resolve(__dirname, '../ds-schemas/DataStandard-5.0.0.json');

export const projectNamespaceEdfi: ProjectNamespace = 'ed-fi' as ProjectNamespace;

/**
 * This is a simple cache implementation that works in Lambdas, see: https://rewind.io/blog/simple-caching-in-aws-lambda-functions/
 */
let apiSchemaCache: ApiSchema | null = null;

/**
 * Loads ApiSchema from an ApiSchema JSON file
 */
async function loadApiSchemaFromFile(filePath: string, traceId: TraceId): Promise<ApiSchema> {
  const apiSchema: ApiSchema = (await fs.readJson(filePath)) as ApiSchema;
  apiSchemaCache = apiSchema;
  writeDebugMessage(moduleName, 'loadApiSchemaFromFile', traceId, `Loading ApiSchema from ${filePath}`);
  return apiSchema;
}

/**
 * Entry point for loading ApiSchemas from a file
 */
export async function findApiSchema(traceId: TraceId): Promise<ApiSchema> {
  if (apiSchemaCache != null) return apiSchemaCache;

  try {
    return await loadApiSchemaFromFile(dataStandard33bPath, traceId);
  } catch (e) {
    writeErrorToLog(moduleName, traceId, 'getApiSchema', e);
  }
  return NoApiSchema;
}
