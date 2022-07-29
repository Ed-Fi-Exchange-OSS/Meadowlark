// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { PaginationParameters } from '../../src/message/PaginationParameters';
import { validatePaginationParameters } from '../../src/validation/PaginationValidator';

describe('when validating pagination parameters', () => {
  describe('given valid inputs', () => {
    it.each([
      ['5', '1'],
      ['5', undefined],
    ])('limit = %s and offset = %s should be accepted', (limit, offset) => {
      const parameters: PaginationParameters = {
        limit,
        offset,
      };

      const result = validatePaginationParameters(parameters);

      expect(result).toBeUndefined();
    });
  });

  describe('given erroneous inputs', () => {
    it.each([
      ['1', '-1', ['offset']],
      ['-1', '1', ['limit']],
      ['-1', '-1', ['limit', 'offset']],
      ['1', 'a', ['offset']],
      ['a', '1', ['limit']],
      ['a', 'a', ['limit', 'offset']],
      [undefined, '1', ['limit']],
    ])('limit = %s and offset = %s should return an error message', (limit, offset, errors) => {
      const parameters: PaginationParameters = {
        limit,
        offset,
      };

      const expected = JSON.stringify({
        invalidQueryTerms: errors,
      });

      const result = validatePaginationParameters(parameters);

      expect(result).toBe(expected);
    });
  });
});
