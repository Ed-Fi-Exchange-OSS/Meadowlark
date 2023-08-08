// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { TopLevelEntity } from '@edfi/metaed-core';
import type { ValidationError } from '@apideck/better-ajv-errors';
import { validateEntityBodyAgainstSchema } from '../metaed/MetaEdValidation';

export type ValidationFailure = { error: ValidationError[] | null };

/**
 * Performs validation of a document against a resource.
 *
 * Validates the request body for the resource. If invalid, returns an error message.
 */
export async function validateDocument(
  body: object,
  matchingMetaEdModel: TopLevelEntity,
  isUpdate: boolean = false,
): Promise<ValidationFailure | null> {
  const validationErrors: ValidationError[] | null = validateEntityBodyAgainstSchema(matchingMetaEdModel, body, isUpdate);
  return validationErrors == null ? null : { error: validationErrors };
}
