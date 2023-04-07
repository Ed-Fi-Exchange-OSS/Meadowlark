// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import path from 'path';
import fs from 'fs-extra';
import {
  executePipeline,
  newMetaEdConfiguration,
  newPipelineOptions,
  newState,
  State,
  MetaEdConfiguration,
} from '@edfi/metaed-core';
import { initialize as edfiApiSchema } from '@edfi/metaed-plugin-edfi-api-schema';
import { initialize as edfiUnified } from '@edfi/metaed-plugin-edfi-unified';

import { findMetaEdProjectMetadata, MetaEdProjectMetadata } from './MetaEdProjectMetadata';

/**
 * Determine whether we are in a deployed Lambda environment or in a development monorepo environment,
 * where a 'packages' directory exists.
 */
const isDevEnvironment = () => fs.existsSync(path.resolve(__dirname, '../../../../packages'));

/**
 * Get the correct node_modules path, whether we are in a deployed Lambda environment
 * or in a development monorepo environment
 */

function nodeModulesPath(): string {
  const directory = isDevEnvironment() ? '../../../../node_modules' : '../../node_modules';
  return path.resolve(__dirname, directory);
}

/**
 * Creates a MetaEdConfiguration object from MetaEdProjectMetadata
 */
function metaEdConfigurationFrom(metaEdProjectMetadata: MetaEdProjectMetadata[]): MetaEdConfiguration {
  const metaEdConfiguration: MetaEdConfiguration = {
    ...newMetaEdConfiguration(),
    defaultPluginTechVersion: '3.4.0',
  };

  metaEdProjectMetadata.forEach((pm) => {
    metaEdConfiguration.projects.push({
      namespaceName: pm.projectNamespace,
      projectName: pm.projectName,
      projectVersion: pm.projectVersion,
      projectExtension: pm.projectExtension,
      description: '',
    });
    metaEdConfiguration.projectPaths.push(pm.projectPath);
  });

  return metaEdConfiguration;
}

// TODO in RND-260: should probably include project version in key
/**
 * This is a simple cache implementation that works in Lambdas, see: https://rewind.io/blog/simple-caching-in-aws-lambda-functions/
 */
const stateCache = {};

function setStateCache(packageName: string, state: State) {
  stateCache[packageName] = state;
}

function getStateCache(packageName: string): State | undefined {
  return stateCache[packageName];
}

/**
 * Entry point for loading a MetaEd project, building a MetaEd internal model and running enhancers.
 */
export async function loadMetaEdState(projectNpmPackageName: string): Promise<State> {
  const cachedState: State | undefined = getStateCache(projectNpmPackageName);
  if (cachedState != null) return cachedState;

  const nodeModules = nodeModulesPath();
  const projectPath = path.resolve(nodeModules, projectNpmPackageName);
  const metaEdProjectMetadata: MetaEdProjectMetadata[] = await findMetaEdProjectMetadata([projectPath]);
  const metaEdConfiguration = metaEdConfigurationFrom(metaEdProjectMetadata);

  let state: State = {
    ...newState(),
    metaEdConfiguration,
    pipelineOptions: Object.assign(newPipelineOptions(), {
      runValidators: true,
      runEnhancers: true,
    }),
    metaEdPlugins: [edfiUnified(), edfiApiSchema()],
  };

  // run MetaEd with downloaded packages
  state = (await executePipeline(state)).state;

  setStateCache(projectNpmPackageName, state);
  return state;
}
