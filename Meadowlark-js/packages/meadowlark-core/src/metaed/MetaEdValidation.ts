// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import Joi from '@hapi/joi';
import didYouMean from 'didyoumean2';
import { MetaEdEnvironment, TopLevelEntity, NoTopLevelEntity } from '@edfi/metaed-core';
import R from 'ramda';
import { ResourceMatchResult } from '../model/ResourceMatchResult';
import { getMetaEdModelForResourceName, getResourceNamesForProject } from './ResourceNameMapping';
import { FrontendQueryParameters } from '../handler/FrontendRequest';

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
  const validationResult: Joi.ValidationResult = metaEdModel.data.meadowlark.joiSchema.validate(body, {
    abortEarly: false,
  });
  if (validationResult.error != null) {
    return validationResult.error.details.map((item) => item.message.replace(/"/g, ''));
  }

  return [];
}

/**
 * Validates that those queryParameters which are present actually belong in the MetaEd entity.
 */
export function validateQueryParametersAgainstSchema(
  metaEdModel: TopLevelEntity,
  queryParameters: FrontendQueryParameters,
): string[] {
  const validationResult: Joi.ValidationResult = metaEdModel.data.meadowlark.joiSchema.validate(queryParameters, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (validationResult != null) {
    const onlyValidParameters = validationResult.value;

    return R.without(Object.keys(onlyValidParameters), Object.keys(queryParameters));
  }

  return [];
}
