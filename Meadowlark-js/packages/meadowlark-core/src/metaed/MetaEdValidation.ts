// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import Ajv from 'ajv/dist/2020';
import addFormatsTo from 'ajv-formats';
import type { ErrorObject, ValidateFunction } from 'ajv';
import { betterAjvErrors, ValidationError } from '@apideck/better-ajv-errors';
import didYouMean from 'didyoumean2';
import memoize from 'fast-memoize';
import { MetaEdEnvironment, TopLevelEntity, NoTopLevelEntity } from '@edfi/metaed-core';
import { getBooleanFromEnvironment } from '@edfi/meadowlark-utilities';
import { ResourceMatchResult } from '../model/ResourceMatchResult';
import { getMetaEdModelForResourceName, getResourceNamesForProject } from './ResourceNameMapping';
import { FrontendQueryParameters } from '../handler/FrontendRequest';

function getAjv(): Ajv {
  const coerceTypes = getBooleanFromEnvironment('ALLOW_TYPE_COERCION', false);

  const ajv = new Ajv({ allErrors: true, coerceTypes });
  addFormatsTo(ajv);

  return ajv;
}

// Ajv caches compiled schemas, so we'll cache it
const ajv = () => memoize(getAjv)();

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
export function validateEntityBodyAgainstSchema(metaEdModel: TopLevelEntity, body: object): ValidationError[] | null {
  const schema = metaEdModel.data.meadowlark.jsonSchema;

  const validateFunction: ValidateFunction = ajv().compile(schema);
  const isValid: boolean = validateFunction(body);

  if (isValid) return null;

  return betterAjvErrors({
    data: body,
    schema,
    errors: validateFunction.errors,
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
  // TODO: RND-67 removed the Joi-specific code to report invalid query parameters
  // RND-307 will restore as a part of understanding Ajv error metadata

  let errors: string[] = [];

  const schema = {
    ...metaEdModel.data.meadowlark.jsonSchema,
    // Need to relax the validation such that no fields are "required"
    required: [],
  };

  const parameterKeys = Object.keys(queryParameters);

  /**
   * Number and boolean are come through as strings, which causes ajv to fail validation of parameters
   * This loops through all query parameters and checks the type against the schema, if the type is numeric or boolean
   * it will attempt convert the value. If the conversion is good, we set the value back and ajv will validate the schema
   * If the value can't be converted (i.e. a word is provided for a numeric value, we leave it and let ajv invalidate
   * the schema).
   */

  parameterKeys.forEach((keyValue) => {
    const property = schema.properties[keyValue];

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

  const valid: ValidateFunction = ajv().compile(schema);

  const isValid: boolean = valid(queryParameters);

  if (isValid) return [];

  if (valid.errors) {
    const ajvErrors = valid.errors.map((error: ErrorObject) => {
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
