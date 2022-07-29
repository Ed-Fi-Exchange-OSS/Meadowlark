// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { newTopLevelEntity, newEntityProperty } from '@edfi/metaed-core';
import Joi from '@hapi/joi';
import { validatePartialEntityBodyAgainstSchema } from '../../src/metaed/MetaEdValidation';

const createModel = () => {
  const model = newTopLevelEntity();
  model.baseEntityName = 'Student';
  const property = newEntityProperty();
  property.metaEdName = 'uniqueId';
  model.properties.concat([property]);
  model.data.meadowlark = {
    joiSchema: Joi.object({
      uniqueId: Joi.string(),
    }),
  };
  return model;
};

describe('when validating a partial entity body', () => {
  describe('given body has no properties', () => {
    it('should not return an error', () => {
      const body = {};

      const validationResult = validatePartialEntityBodyAgainstSchema(createModel(), body);

      expect(validationResult).toHaveLength(0);
    });
  });

  describe('given body has a valid property', () => {
    it('should not return an error', () => {
      const body = { uniqueId: 'a' };

      const validationResult = validatePartialEntityBodyAgainstSchema(createModel(), body);

      expect(validationResult).toHaveLength(0);
    });
  });

  describe('given body has two invalid properties and a valid one', () => {
    let validationResult: string[];

    beforeAll(() => {
      const body = { uniqueId: 'a', one: 'one', two: 'two' };

      validationResult = validatePartialEntityBodyAgainstSchema(createModel(), body);
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
