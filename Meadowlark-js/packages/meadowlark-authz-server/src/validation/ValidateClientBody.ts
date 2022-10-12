// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { ValidateFunction } from 'ajv';
import { betterAjvErrors } from '@apideck/better-ajv-errors';
import { ajv } from './SharedAjv';
import { createClientBodySchema } from '../model/CreateClientBody';
import { BodyValidation } from './BodyValidation';

const createClientBodyValidator: ValidateFunction = ajv.compile(createClientBodySchema);

export function validateCreateClientBody(body: object): BodyValidation {
  const isValid: boolean = createClientBodyValidator(body);
  if (isValid) return { isValid };
  return {
    isValid,
    failureMessage: JSON.stringify(
      betterAjvErrors({
        data: body,
        schema: createClientBodySchema as any,
        errors: createClientBodyValidator.errors,
        basePath: '{requestBody}',
      }),
    ),
  };
}

export function validateUpdateClientBody(body: object): BodyValidation {
  // Update body is the same as create body
  return validateCreateClientBody(body);
}
