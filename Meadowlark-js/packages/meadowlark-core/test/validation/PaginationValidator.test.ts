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

  const errorNegativeLimit = {
    error: 'The request is invalid.',
    modelState: {
      limit: ['Must be set to a numeric value >= 1'],
      offset: [],
    },
  };
  const errorNegativeOffset = {
    error: 'The request is invalid.',
    modelState: {
      limit: [],
      offset: ['Must be set to a numeric value >= 1'],
    },
  };
  const errorNegativeOffsetAndLimit = {
    error: 'The request is invalid.',
    modelState: {
      limit: ['Must be set to a numeric value >= 1'],
      offset: ['Must be set to a numeric value >= 1'],
    },
  };
  const errorAlphaLimit = {
    error: 'The request is invalid.',
    modelState: {
      limit: ['Must be set to a numeric value >= 1'],
      offset: [],
    },
  };
  const errorAlphaOffset = {
    error: 'The request is invalid.',
    modelState: {
      limit: [],
      offset: ['Must be set to a numeric value >= 1'],
    },
  };
  const errorAlphaOffsetAndLimit = {
    error: 'The request is invalid.',
    modelState: {
      limit: ['Must be set to a numeric value >= 1'],
      offset: ['Must be set to a numeric value >= 1'],
    },
  };
  const errorOffsetWithoutLimit = {
    error: 'The request is invalid.',
    modelState: {
      limit: ['Limit must be provided when using offset'],
      offset: [],
    },
  };

  describe('given erroneous inputs', () => {
    it.each([
      ['1', '-1', errorNegativeOffset],
      ['-1', '1', errorNegativeLimit],
      ['-1', '-1', errorNegativeOffsetAndLimit],
      ['a', '1', errorAlphaLimit],
      ['1', 'b', errorAlphaOffset],
      ['a', 'b', errorAlphaOffsetAndLimit],
      [undefined, '1', errorOffsetWithoutLimit],
    ])('limit = %s and offset = %s should return an error message', (limit, offset, errors) => {
      const parameters: PaginationParameters = {
        limit,
        offset,
      };

      const result = validatePaginationParameters(parameters);

      expect(result).toStrictEqual(errors);
    });
  });
});
