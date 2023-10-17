// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import didYouMean from 'didyoumean2';
import { PathComponents } from '../model/PathComponents';
import { NoResourceInfo } from '../model/ResourceInfo';
import { TraceId } from '../model/IdTypes';
import { NoResourceSchema, ResourceSchema } from '../model/api-schema/ResourceSchema';
import { findResourceSchema } from '../api-schema/ResourceSchemaFinder';
import { EndpointName } from '../model/api-schema/EndpointName';
import { ProjectSchema } from '../model/api-schema/ProjectSchema';
import { EndpointValidationResult } from './EndpointValidationResult';
import { ApiSchema } from '../model/api-schema/ApiSchema';
import { ProjectNamespace } from '../model/api-schema/ProjectNamespace';
import { findProjectSchema } from '../api-schema/ProjectSchemaFinder';

/** The result of an attempt to match an EndpointName with a ResourceSchema */
type MatchResourceSchemaResult = {
  /**
   * If the endpointName is not a match but a suggestion was available, this is the suggested EndpointName
   */
  suggestedEndpointName?: EndpointName;

  /**
   * If endpointName is an exact match this is the matching ResourceSchema.
   */
  matchingResourceSchema?: ResourceSchema;
};

/**
 * Returns a list of the valid endpoint names for a ProjectNamespace.
 */
function validEndpointNamesFor(apiSchema: ApiSchema, projectNamespace: ProjectNamespace): EndpointName[] {
  return Object.keys(apiSchema.projectSchemas[projectNamespace].resourceSchemas) as EndpointName[];
}

/**
 * Finds the ResourceSchema that matches the EndpointName of the API request, or provides a suggestion
 * if no match is found.
 */
async function matchResourceSchema(
  apiSchema: ApiSchema,
  pathComponents: PathComponents,
  traceId: TraceId,
): Promise<MatchResourceSchemaResult> {
  const matchingResourceSchema: ResourceSchema | undefined = await findResourceSchema(apiSchema, pathComponents, traceId);
  if (matchingResourceSchema != null) {
    return { matchingResourceSchema };
  }

  const suggestion = didYouMean(
    pathComponents.endpointName,
    validEndpointNamesFor(apiSchema, pathComponents.projectNamespace),
  );
  if (suggestion == null) return {};

  const suggestedEndpointName = Array.isArray(suggestion) ? suggestion[0] : suggestion;
  return { suggestedEndpointName };
}

/**
 * Validates that an endpoint maps to a ResourceSchema
 */
export async function validateEndpoint(
  apiSchema: ApiSchema,
  pathComponents: PathComponents,
  traceId: TraceId,
): Promise<EndpointValidationResult> {
  const { matchingResourceSchema, suggestedEndpointName } = await matchResourceSchema(apiSchema, pathComponents, traceId);

  if (suggestedEndpointName !== null) {
    const invalidResourceMessage = `Invalid resource '${pathComponents.endpointName}'. The most similar resource is '${suggestedEndpointName}'.`;

    return {
      resourceSchema: NoResourceSchema,
      resourceInfo: NoResourceInfo,
      errorBody: {
        error: invalidResourceMessage,
      },
    };
  }

  if (matchingResourceSchema == null) {
    return {
      resourceSchema: NoResourceSchema,
      resourceInfo: NoResourceInfo,
      errorBody: { error: `Invalid resource '${pathComponents.endpointName}'.` },
    };
  }

  const projectSchema: ProjectSchema = await findProjectSchema(apiSchema, pathComponents.projectNamespace, traceId);

  return {
    resourceSchema: matchingResourceSchema,
    resourceInfo: {
      projectName: projectSchema.projectName,
      resourceVersion: projectSchema.projectVersion,
      resourceName: matchingResourceSchema.resourceName,
      isDescriptor: matchingResourceSchema.isDescriptor,
      allowIdentityUpdates: matchingResourceSchema.allowIdentityUpdates,
    },
    headerMetadata: {
      'X-Project-Name': projectSchema.projectName,
      'X-Project-Version': projectSchema.projectVersion,
    },
  };
}
