// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import Ajv from 'ajv/dist/2020';
import addFormatsTo from 'ajv-formats';
import type { ValidateFunction } from 'ajv';
import { getBooleanFromEnvironment } from '@edfi/meadowlark-utilities';
import { ResourceSchema } from '../model/api-schema/ResourceSchema';

/**
 * Compiled ajv JSON Schema validator functions for the API resource
 */
export type ResourceSchemaValidators = {
  insertValidator: ValidateFunction;
  queryValidator: ValidateFunction;
  updateValidator: ValidateFunction;
};

function initializeAjv(): Ajv {
  const removeAdditional = false; // TODO: replace on merge with RND-651
  const coerceTypes = getBooleanFromEnvironment('ALLOW_TYPE_COERCION', false);

  const ajv = new Ajv({ allErrors: true, coerceTypes, removeAdditional });
  addFormatsTo(ajv);

  return ajv;
}

// Simple cache of a configured Ajv
let ajv: Ajv | null = null;

// simple cache implementation, see: https://rewind.io/blog/simple-caching-in-aws-lambda-functions/
/** This is a cache mapping ResourceSchema objects to compiled ajv JSON Schema validators for the API resource */
const validatorCache: Map<ResourceSchema, ResourceSchemaValidators> = new Map();

/**
 * Returns the API resource JSON Schema validator functions for the given ResourceSchema. Caches results.
 */
export function getSchemaValidatorsFor(resourceSchema: ResourceSchema): ResourceSchemaValidators {
  if (ajv == null) ajv = initializeAjv();

  const cachedValidators: ResourceSchemaValidators | undefined = validatorCache.get(resourceSchema);
  if (cachedValidators != null) return cachedValidators;

  const resourceValidators: ResourceSchemaValidators = {
    insertValidator: ajv.compile(resourceSchema.jsonSchemaForInsert),
    queryValidator: ajv.compile(resourceSchema.jsonSchemaForQuery),
    updateValidator: ajv.compile(resourceSchema.jsonSchemaForUpdate),
  };
  validatorCache.set(resourceSchema, resourceValidators);
  return resourceValidators;
}

/**
 * Function to remove all validators from validatorCache for testing purposes.
 */
export function clearAllValidatorCache(): void {
  validatorCache.clear();
}
