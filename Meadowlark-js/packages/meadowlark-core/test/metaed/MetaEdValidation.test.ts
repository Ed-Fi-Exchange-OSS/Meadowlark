// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { newTopLevelEntity, newEntityProperty } from '@edfi/metaed-core';
import Joi from '@hapi/joi';
import { validateQueryParametersAgainstSchema } from '../../src/metaed/MetaEdValidation';

const createModel = () => ({
  ...newTopLevelEntity(),
  baseEntityName: 'Student',
  properties: [{ ...newEntityProperty(), metaEdName: 'uniqueId' }],
  data: {
    meadowlark: {
      joiSchema: Joi.object({
        uniqueId: Joi.string(),
      }),
    },
  },
});

describe('when validating query parameters', () => {
  describe('given query parameters have no properties', () => {
    it('should not return an error', () => {
      const queryParameters = {};

      const validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);

      expect(validationResult).toHaveLength(0);
    });
  });

  describe('given query parameters have a valid property', () => {
    it('should not return an error', () => {
      const queryParameters = { uniqueId: 'a' };

      const validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);

      expect(validationResult).toHaveLength(0);
    });
  });

  describe('given query parameters have two invalid properties and a valid one', () => {
    let validationResult: string[];

    beforeAll(() => {
      const queryParameters = { uniqueId: 'a', one: 'one', two: 'two' };

      validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);
    });

    it('should have two errors', () => {
      expect(validationResult).toHaveLength(2);
    });

    it('should contain property `one`', () => {
      expect(validationResult).toContain('one');
    });

    it('should contain property `two`', () => {
      expect(validationResult).toContain('two');
    });
  });
});
