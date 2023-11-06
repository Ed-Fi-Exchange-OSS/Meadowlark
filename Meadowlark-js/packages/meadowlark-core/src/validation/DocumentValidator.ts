// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { betterAjvErrors, type ValidationError } from '@apideck/better-ajv-errors';
import { ValidateFunction } from 'ajv';
import { ResourceSchema } from '../model/api-schema/ResourceSchema';
import { ResourceSchemaValidators, getSchemaValidatorsFor } from './ResourceSchemaValidation';

export type ValidationFailure = { error: ValidationError[] | null };

/**
 * Validate the JSON body of the request against the JSON schema for the corresponding API resource
 */
export function validateDocument(
  resourceSchema: ResourceSchema,
  body: object,
  isUpdate: boolean = false,
): ValidationFailure | null {
  const resourceValidators: ResourceSchemaValidators = getSchemaValidatorsFor(resourceSchema);
  const validator: ValidateFunction = isUpdate ? resourceValidators.updateValidator : resourceValidators.insertValidator;

  const isValid: boolean = validator(body);

  if (isValid) return null;

  const validationErrors: ValidationError[] | null = betterAjvErrors({
    data: body,
    schema: isUpdate ? resourceSchema.jsonSchemaForUpdate : resourceSchema.jsonSchemaForInsert,
    errors: validator.errors,
    basePath: '{requestBody}',
  });

  return validationErrors == null ? null : { error: validationErrors };
}
