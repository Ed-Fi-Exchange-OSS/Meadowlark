import { PaginationParameters } from '../message/PaginationParameters';

const isNotPositiveInteger = (value: string): Boolean => !Number(value) || Number.parseInt(value, 10) < 1;

/**
 * Validates the `limit` and `offset` parameters from a query string.
 */
export function validatePaginationParameters(parameters: PaginationParameters): string | undefined {
  // Acceptable for neither to be defined
  if (parameters.limit == null && parameters.offset == null) {
    return undefined;
  }

  const invalidQueryTerms: string[] = [];
  if (parameters.limit != null) {
    if (isNotPositiveInteger(parameters.limit)) {
      invalidQueryTerms.push('limit');
    }
  }

  if (parameters.offset != null) {
    if (isNotPositiveInteger(parameters.offset)) {
      invalidQueryTerms.push('offset');
    }

    // Can't have an offset without a limit (but reverse _is_ acceptable)
    if (parameters.limit == null) {
      invalidQueryTerms.push('limit');
    }
  }

  if (invalidQueryTerms.length > 0) {
    return JSON.stringify({ invalidQueryTerms });
  }

  return undefined;
}
