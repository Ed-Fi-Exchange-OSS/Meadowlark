/* eslint-disable no-use-before-define */ // function declarations are hoisted properly in ES6
import { PaginationParameters } from '../message/PaginationParameters';
import { createInvalidRequestResponse } from '../Utility';

const isNotPositiveInteger = (value: string): Boolean => !Number(value) || Number.parseInt(value, 10) < 1;

/**
 * Validates the `limit` and `offset` parameters from a query string.
 */
export function validatePaginationParameters(parameters: PaginationParameters): string | undefined {
  // Acceptable for neither to be defined
  if (parameters.limit == null && parameters.offset == null) {
    return undefined;
  }

  const limit: string[] = [];
  const offset: string[] = [];

  validateLimit();
  validateOffset();

  if (limit.length > 0 || offset.length > 0) {
    return createInvalidRequestResponse({ limit, offset });
  }

  return undefined;

  function validateLimit() {
    if (parameters.limit != null) {
      if (isNotPositiveInteger(parameters.limit)) {
        limit.push('Must be set to a numeric value >= 1');
      }
    }
  }

  function validateOffset() {
    if (parameters.offset != null) {
      if (isNotPositiveInteger(parameters.offset)) {
        offset.push('Must be set to a numeric value >= 1');
      }

      // Can't have an offset without a limit (but reverse _is_ acceptable)
      if (parameters.limit == null) {
        limit.push('Limit must be provided when using offset');
      }
    }
  }
}
