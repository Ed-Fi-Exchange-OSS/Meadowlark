// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { Enhancer, MetaEdEnvironment, PluginEnvironment } from '@edfi/metaed-core';
import { initialize as edfiApiSchema } from '@edfi/metaed-plugin-edfi-api-schema';
import type { ApiSchema } from '../src/model/api-schema/ApiSchema';

type PluginEnvironmentEdfiApiSchema = {
  apiSchema: ApiSchema;
};

export function apiSchemaFrom(metaEd: MetaEdEnvironment): ApiSchema {
  metaEd.plugin.set('edfiApiSchema', {} as PluginEnvironment);

  edfiApiSchema().enhancer.forEach((enhancer: Enhancer) => {
    enhancer(metaEd);
  });

  const pluginEnvironment = metaEd.plugin.get('edfiApiSchema') as PluginEnvironment;
  return (pluginEnvironment.data as PluginEnvironmentEdfiApiSchema).apiSchema;
}

export function restoreSpies(spies: jest.SpyInstance[]) {
  spies.forEach((spy) => spy.mockRestore());
}
