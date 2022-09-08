// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { TopLevelEntity } from '@edfi/metaed-core';
import { validateEntityBodyAgainstSchema } from '../metaed/MetaEdValidation';

/**
 * Performs validation of a document against a resource.
 *
 * Validates the request body for the resource. If invalid, returns an error message.
 */
export async function validateDocument(body: object, matchingMetaEdModel: TopLevelEntity): Promise<string> {
  const validationErrors: string[] = validateEntityBodyAgainstSchema(matchingMetaEdModel, body);
  return validationErrors.length === 0 ? '' : JSON.stringify({ message: validationErrors });
}
