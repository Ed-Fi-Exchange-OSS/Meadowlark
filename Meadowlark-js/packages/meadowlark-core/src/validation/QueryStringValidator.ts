// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { TopLevelEntity } from '@edfi/metaed-core';
import { FrontendQueryParameters } from '../handler/FrontendRequest';
import { validateQueryParametersAgainstSchema } from '../metaed/MetaEdValidation';
import { createInvalidRequestResponse } from '../Utility';

export type QueryStringValidationResult = {
  /**
   * Error message for validation failure
   */
  errorBody?: object | string;
};

/**
 * Validates that the provided query string belongs with the MetaEd resource specified by the PathComponents.
 */
export async function validateQueryString(
  queryStrings: FrontendQueryParameters,
  matchingMetaEdModel: TopLevelEntity,
): Promise<QueryStringValidationResult> {
  const bodyValidation: string[] = validateQueryParametersAgainstSchema(matchingMetaEdModel, queryStrings);
  if (bodyValidation.length > 0) {
    const modelState = Object.assign({}, ...bodyValidation.map((x) => ({ [x]: 'Invalid property' })));
    return {
      errorBody: createInvalidRequestResponse(modelState),
    };
  }

  return {};
}
