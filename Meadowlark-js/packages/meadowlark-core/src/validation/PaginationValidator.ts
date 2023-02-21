// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { PaginationParameters } from '../message/PaginationParameters';
import { createInvalidRequestResponse } from '../Utility';

const isNotPositiveInteger = (value: string | number): boolean =>
  Number.isNaN(Number(value)) || (R.is(Number, value) ? value : Number.parseInt(value.toString(), 10)) < 0;

/**
 * Validates the `limit` and `offset` parameters from a query string.
 */
export function validatePaginationParameters(parameters: PaginationParameters): object | undefined {
  function validateLimit(): void {
    if (parameters.limit != null) {
      if (isNotPositiveInteger(parameters.limit)) {
        // eslint-disable-next-line no-use-before-define
        limitErrors.push('Must be set to a numeric value >= 0');
      }
    }
  }

  function validateOffset(): void {
    if (parameters.offset != null) {
      if (isNotPositiveInteger(parameters.offset)) {
        // eslint-disable-next-line no-use-before-define
        offsetErrors.push('Must be set to a numeric value >= 0');
      }

      // Can't have an offset without a limit (but reverse _is_ acceptable)
      if (parameters.limit == null) {
        // eslint-disable-next-line no-use-before-define
        limitErrors.push('Limit must be provided when using offset');
      }
    }
  }

  // Acceptable for neither to be defined
  if (parameters.limit == null && parameters.offset == null) {
    return undefined;
  }

  const limitErrors: string[] = [];
  const offsetErrors: string[] = [];

  validateLimit();
  validateOffset();

  if (limitErrors.length > 0 || offsetErrors.length > 0) {
    return createInvalidRequestResponse({ limit: limitErrors, offset: offsetErrors });
  }

  return undefined;
}
