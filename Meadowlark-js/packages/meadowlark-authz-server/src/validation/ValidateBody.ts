// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import Ajv from 'ajv/dist/2020';
import type { ValidateFunction } from 'ajv';
import { betterAjvErrors } from '@apideck/better-ajv-errors';
import { createClientBodySchema } from '../model/CreateClientBody';

// Ajv caches compiled schemas, so we'll cache it
const ajv: Ajv = new Ajv({ allErrors: true });

export type BodyValidation = { isValid: true } | { isValid: false; failureMessage: string };

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
