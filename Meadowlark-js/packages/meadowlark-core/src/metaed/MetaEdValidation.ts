// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import Ajv from 'ajv/dist/2020';
import addFormatsTo from 'ajv-formats';
import type { ErrorObject, ValidateFunction } from 'ajv';
import didYouMean from 'didyoumean2';
import { MetaEdEnvironment, TopLevelEntity, NoTopLevelEntity } from '@edfi/metaed-core';
import { ResourceMatchResult } from '../model/ResourceMatchResult';
import { getMetaEdModelForResourceName, getResourceNamesForProject } from './ResourceNameMapping';
import { FrontendQueryParameters } from '../handler/FrontendRequest';

// Ajv caches compiled schemas, so we'll cache it
const ajv = new Ajv({ allErrors: true });
addFormatsTo(ajv);

/**
 * Creates a new empty ResourceMatchResult object
 */
export function newResourceMatchResult(): ResourceMatchResult {
  return {
    resourceName: '',
    isDescriptor: false,
    exact: false,
    suggestion: false,
    matchingMetaEdModel: NoTopLevelEntity,
  };
}

/**
 * Finds the MetaEd entity name that matches the endpoint of the API request, or provides a suggestion
 * if no match is found.
 */
export function matchResourceNameToMetaEd(
  resourceName: string,
  metaEd: MetaEdEnvironment,
  namespace: string,
): ResourceMatchResult {
  const matchingMetaEdModel: TopLevelEntity | undefined = getMetaEdModelForResourceName(resourceName, metaEd, namespace);
  if (matchingMetaEdModel != null) {
    return {
      ...newResourceMatchResult(),
      resourceName,
      isDescriptor: matchingMetaEdModel.type === 'descriptor',
      exact: true,
      matchingMetaEdModel,
    };
  }

  const suggestion = didYouMean(resourceName, getResourceNamesForProject(metaEd, namespace));
  if (suggestion == null) return newResourceMatchResult();

  const suggestedName = Array.isArray(suggestion) ? suggestion[0] : suggestion;
  return { ...newResourceMatchResult(), resourceName: suggestedName, suggestion: true };
}

/**
 * Validate the JSON body of the request against the Joi schema for the MetaEd entity corresponding
 * to the API endpoint.
 */
export function validateEntityBodyAgainstSchema(metaEdModel: TopLevelEntity, body: object): string[] {
  const valid: ValidateFunction = ajv.compile(metaEdModel.data.meadowlark.jsonSchema);
  const isValid: boolean = valid(body);

  if (isValid) return [];
  return (valid.errors ?? []).map((error: ErrorObject) => `${error.instancePath} ${error.message}` ?? '');
}

/**
 * Validates that those queryParameters which are present actually belong in the MetaEd entity.
 */
export function validateQueryParametersAgainstSchema(
  metaEdModel: TopLevelEntity,
  queryParameters: FrontendQueryParameters,
): string[] {
  // TODO: RND-67 removed the Joi-specific code to report invalid query parameters
  // RND-307 will restore as a part of understanding Ajv error metadata
  const schema = { ...metaEdModel.data.meadowlark.jsonSchema };

  // Need to relax the validation such that no fields are "required"
  schema.required.length = 0;

  const valid: ValidateFunction = ajv.compile(metaEdModel.data.meadowlark.jsonSchema);

  const isValid: boolean = valid(queryParameters);

  if (isValid) return [];
  return (valid.errors ?? []).map((error: ErrorObject) => `${error.instancePath} ${error.message}` ?? '');
}
