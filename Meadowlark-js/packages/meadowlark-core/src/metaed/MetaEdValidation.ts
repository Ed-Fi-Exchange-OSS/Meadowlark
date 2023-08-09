// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import Ajv from 'ajv/dist/2020';
import addFormatsTo from 'ajv-formats';
import type { ErrorObject, ValidateFunction } from 'ajv';
import { betterAjvErrors, ValidationError } from '@apideck/better-ajv-errors';
import didYouMean from 'didyoumean2';
import { MetaEdEnvironment, TopLevelEntity, NoTopLevelEntity } from '@edfi/metaed-core';
import { getBooleanFromEnvironment } from '@edfi/meadowlark-utilities';
import type { ResourceMatchResult } from '../model/ResourceMatchResult';
import { getMetaEdModelForResourceName, getResourceNamesForProject } from './ResourceNameMapping';
import type { FrontendQueryParameters } from '../handler/FrontendRequest';

/**
 * Compiled ajv JSON Schema validator functions for the API resource
 */
export type ResourceSchemaValidators = {
  insertValidator: ValidateFunction;
  updateValidator: ValidateFunction;
  queryValidator: ValidateFunction;
};

function initializeAjv(): Ajv {
  const coerceTypes = getBooleanFromEnvironment('ALLOW_TYPE_COERCION', false);

  const ajv = new Ajv({ allErrors: true, coerceTypes });
  addFormatsTo(ajv);

  return ajv;
}

const ajv = initializeAjv();

// simple cache implementation, see: https://rewind.io/blog/simple-caching-in-aws-lambda-functions/
/** This is a cache mapping MetaEd model objects to compiled ajv JSON Schema validators for the API resource */
const validatorCache: Map<TopLevelEntity, ResourceSchemaValidators> = new Map();

/**
 * Returns the API resource JSON Schema validator functions for the given MetaEd model. Caches results.
 */
function getSchemaValidatorsFor(metaEdModel: TopLevelEntity): ResourceSchemaValidators {
  const cachedValidators: ResourceSchemaValidators | undefined = validatorCache.get(metaEdModel);
  if (cachedValidators != null) return cachedValidators;

  const resourceValidators: ResourceSchemaValidators = {
    insertValidator: ajv.compile(metaEdModel.data.edfiApiSchema.jsonSchemaForInsert),
    updateValidator: ajv.compile(metaEdModel.data.edfiApiSchema.jsonSchemaForUpdate),
    queryValidator: ajv.compile({
      ...metaEdModel.data.edfiApiSchema.jsonSchemaForInsert,
      // Need to relax the validation such that no fields are "required"
      required: [],
    }),
  };
  validatorCache.set(metaEdModel, resourceValidators);
  return resourceValidators;
}

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
export function validateEntityBodyAgainstSchema(
  metaEdModel: TopLevelEntity,
  body: object,
  isUpdate: boolean = false,
): ValidationError[] | null {
  const resourceValidators: ResourceSchemaValidators = getSchemaValidatorsFor(metaEdModel);
  const validator: ValidateFunction = isUpdate ? resourceValidators.updateValidator : resourceValidators.insertValidator;

  const isValid: boolean = validator(body);

  if (isValid) return null;

  return betterAjvErrors({
    data: body,
    schema: isUpdate
      ? metaEdModel.data.edfiApiSchema.jsonSchemaForUpdate
      : metaEdModel.data.edfiApiSchema.jsonSchemaForInsert,
    errors: validator.errors,
    basePath: '{requestBody}',
  });
}

/**
 * Validates that those queryParameters which are present actually belong in the MetaEd entity.
 */
export function validateQueryParametersAgainstSchema(
  metaEdModel: TopLevelEntity,
  queryParameters: FrontendQueryParameters,
): string[] {
  const { queryValidator } = getSchemaValidatorsFor(metaEdModel);

  let errors: string[] = [];

  /**
   * Number and boolean are come through as strings, which causes ajv to fail validation of parameters
   * This loops through all query parameters and checks the type against the schema, if the type is numeric or boolean
   * it will attempt convert the value. If the conversion is good, we set the value back and ajv will validate the schema
   * If the value can't be converted (i.e. a word is provided for a numeric value, we leave it and let ajv invalidate
   * the schema).
   */
  Object.keys(queryParameters).forEach((keyValue) => {
    const property = metaEdModel.data.edfiApiSchema.jsonSchemaForInsert.properties[keyValue];

    if (property != null && property.type != null) {
      if ((property && property?.type === 'integer') || property.type === 'number') {
        const value = Number(queryParameters[keyValue]);
        if (!Number.isNaN(value)) {
          queryParameters[keyValue] = value;
        }
      }
      if (property.type === 'boolean' && (queryParameters[keyValue] === 'true' || queryParameters[keyValue] === 'false')) {
        queryParameters[keyValue] = Boolean(queryParameters[keyValue]);
      }
    }
  });

  const isValid: boolean = queryValidator(queryParameters);

  if (isValid) return [];

  if (queryValidator.errors) {
    const ajvErrors = queryValidator.errors.map((error: ErrorObject) => {
      // When a parameter name is invalid instancePath is null thus only
      // shows the error message which looks like the following: ' must NOT have additional properties'
      if (error.instancePath === '' && error.keyword === 'additionalProperties') {
        return `${metaEdModel.metaEdName} does not include property '${error.params.additionalProperty}'`;
      }
      return `${error.instancePath} ${error.message}` ?? '';
    });

    errors = [...errors, ...ajvErrors];
  }

  return errors;
}
