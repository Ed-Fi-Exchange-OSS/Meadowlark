// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { ErrorObject } from 'ajv';
import { FrontendQueryParameters } from '../handler/FrontendRequest';
import { ResourceSchema } from '../model/api-schema/ResourceSchema';
import { createInvalidRequestResponse } from '../Utility';
import { getSchemaValidatorsFor } from './ResourceSchemaValidation';

export type QueryStringValidationResult = {
  /**
   * Error message for validation failure
   */
  errorBody?: object | string;
};

/**
 * Validates that those queryParameters which are present are actually fields on the API resource
 */
function validateQueryParameters(resourceSchema: ResourceSchema, queryParameters: FrontendQueryParameters): string[] {
  const { queryValidator } = getSchemaValidatorsFor(resourceSchema);

  let errors: string[] = [];

  /**
   * Number and boolean are come through as strings, which causes ajv to fail validation of parameters
   * This loops through all query parameters and checks the type against the schema, if the type is numeric or boolean
   * it will attempt convert the value. If the conversion is good, we set the value back and ajv will validate the schema
   * If the value can't be converted (i.e. a word is provided for a numeric value, we leave it and let ajv invalidate
   * the schema).
   */
  Object.keys(queryParameters).forEach((keyValue) => {
    const property = resourceSchema.jsonSchemaForQuery.properties[keyValue];

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
        return `${resourceSchema.resourceName} does not include property '${error.params.additionalProperty}'`;
      }
      return `${error.instancePath} ${error.message}` ?? '';
    });

    errors = [...errors, ...ajvErrors];
  }

  return errors;
}

/**
 * Validates that the query string keys are actually fields on the API resource.
 */
export async function validateQueryString(
  queryStrings: FrontendQueryParameters,
  resourceSchema: ResourceSchema,
): Promise<QueryStringValidationResult> {
  const bodyValidation: string[] = validateQueryParameters(resourceSchema, queryStrings);
  if (bodyValidation.length > 0) {
    const modelState = Object.assign({}, ...bodyValidation.map((x) => ({ [x]: 'Invalid property' })));
    return {
      errorBody: createInvalidRequestResponse(modelState),
    };
  }

  return {};
}
