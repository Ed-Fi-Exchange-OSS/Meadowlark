// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { ValidateFunction } from 'ajv';
import { betterAjvErrors } from '@apideck/better-ajv-errors';
import { ajv } from './SharedAjv';
import { createClientBodySchema } from '../model/CreateClientBody';
import { requestTokenBodySchema } from '../model/RequestTokenBody';
import { verifyTokenBodySchema } from '../model/VerifyTokenBody';

export type BodyValidation = { isValid: true } | { isValid: false; failureMessage: string };

const createClientBodyValidator: ValidateFunction = ajv.compile(createClientBodySchema);
const requestTokenBodyValidator: ValidateFunction = ajv.compile(requestTokenBodySchema);
const verifyTokenBodyValidator: ValidateFunction = ajv.compile(verifyTokenBodySchema);

function validateBody(body: object, schema: object, validateFunction: ValidateFunction): BodyValidation {
  const isValid: boolean = validateFunction(body);
  if (isValid) return { isValid };
  return {
    isValid,
    failureMessage: JSON.stringify(
      betterAjvErrors({
        data: body,
        schema,
        errors: validateFunction.errors,
        basePath: '{requestBody}',
      }),
    ),
  };
}

export function validateCreateClientBody(body: object): BodyValidation {
  return validateBody(body, createClientBodySchema, createClientBodyValidator);
}

export function validateRequestTokenBody(body: object): BodyValidation {
  return validateBody(body, requestTokenBodySchema, requestTokenBodyValidator);
}

export function validateVerifyTokenBody(body: object): BodyValidation {
  return validateBody(body, verifyTokenBodySchema, verifyTokenBodyValidator);
}

export function validateUpdateClientBody(body: object): BodyValidation {
  // Same as CreateClientBody
  return validateBody(body, createClientBodySchema, createClientBodyValidator);
}
