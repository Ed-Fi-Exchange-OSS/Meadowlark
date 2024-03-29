// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import didYouMean, { ThresholdTypeEnums } from 'didyoumean2';
import { ValidateFunction } from 'ajv';
import { betterAjvErrors } from '@apideck/better-ajv-errors';
import { ajv } from './SharedAjv';

import { clientBodySchema } from '../model/ClientBody';
import { requestTokenBodySchema } from '../model/RequestTokenBody';
import { verifyTokenBodySchema } from '../model/VerifyTokenBody';

export type Suggestion = { current: string; suggested: string };
export type BodyValidation = { isValid: true } | { isValid: false; failureMessage: object; suggestions: Suggestion[] };

const createClientBodyValidator: ValidateFunction = ajv.compile(clientBodySchema);
const requestTokenBodyValidator: ValidateFunction = ajv.compile(requestTokenBodySchema);
const verifyTokenBodyValidator: ValidateFunction = ajv.compile(verifyTokenBodySchema);

function validateBody(body: object, schema: object, validateFunction: ValidateFunction): BodyValidation {
  const isValid: boolean = validateFunction(body);
  const suggestions: Suggestion[] = [];
  if (isValid) return { isValid };

  const { errors } = validateFunction;

  // Should be typed
  const requiredKeys = Object.keys((schema as any).properties);
  const additionalKeys = errors
    ? errors
        .filter((key) => key.keyword === 'additionalProperties')
        .map((property) => property.params.additionalProperty as string)
    : [];

  // Check for expected values in the ajv error messages to compare with provided values.
  // This will provide suggestions for properties with correct value but wrong case, allowing to have case insensitive requests
  additionalKeys.forEach((current) => {
    // Update the threshold for didYouMean to not allow words with similar lengths or typos.
    const suggested = didYouMean(current, requiredKeys, { thresholdType: ThresholdTypeEnums.SIMILARITY, threshold: 1 });
    if (suggested) {
      suggestions.push({ current, suggested });
    }
  });

  return {
    isValid,
    failureMessage: betterAjvErrors({
      data: body,
      schema,
      errors: validateFunction.errors,
      basePath: '{requestBody}',
    }),
    suggestions,
  };
}

export function applySuggestions(body: object, suggestions: Suggestion[]): object {
  let bodyWithSuggestions = JSON.stringify(body);
  suggestions.forEach((suggestion) => {
    bodyWithSuggestions = bodyWithSuggestions.replace(suggestion.current, suggestion.suggested);
  });

  const updatedBody = JSON.parse(bodyWithSuggestions);
  return updatedBody;
}

export function validateCreateClientBody(body: object): BodyValidation {
  return validateBody(body, clientBodySchema, createClientBodyValidator);
}

export function validateRequestTokenBody(body: object): BodyValidation {
  return validateBody(body, requestTokenBodySchema, requestTokenBodyValidator);
}

export function validateVerifyTokenBody(body: object): BodyValidation {
  return validateBody(body, verifyTokenBodySchema, verifyTokenBodyValidator);
}

export function validateUpdateClientBody(body: object): BodyValidation {
  // Same as CreateClientBody
  return validateBody(body, clientBodySchema, createClientBodyValidator);
}
