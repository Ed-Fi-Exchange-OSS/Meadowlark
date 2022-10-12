// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { ValidateFunction } from 'ajv';
import { betterAjvErrors } from '@apideck/better-ajv-errors';
import { ajv } from './SharedAjv';
import { requestTokenBodySchema } from '../model/RequestTokenBody';
import { BodyValidation } from './BodyValidation';

const requestTokenBodyValidator: ValidateFunction = ajv.compile(requestTokenBodySchema);

export function validateRequestTokenBody(body: object): BodyValidation {
  const isValid: boolean = requestTokenBodyValidator(body);
  if (isValid) return { isValid };
  return {
    isValid,
    failureMessage: JSON.stringify(
      betterAjvErrors({
        data: body,
        schema: requestTokenBodySchema as any,
        errors: requestTokenBodyValidator.errors,
        basePath: '{requestBody}',
      }),
    ),
  };
}
