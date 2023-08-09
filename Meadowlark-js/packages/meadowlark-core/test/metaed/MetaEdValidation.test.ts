// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { newTopLevelEntity, newEntityProperty, TopLevelEntity } from '@edfi/metaed-core';
import { validateQueryParametersAgainstSchema } from '../../src/metaed/MetaEdValidation';

const createModel = (): TopLevelEntity => ({
  ...newTopLevelEntity(),
  metaEdName: 'Student',
  properties: [
    { ...newEntityProperty(), metaEdName: 'uniqueId', isPartOfIdentity: true },
    { ...newEntityProperty(), metaEdName: 'someBooleanParameter', isPartOfIdentity: false },
    { ...newEntityProperty(), metaEdName: 'someIntegerParameter', isPartOfIdentity: false },
    { ...newEntityProperty(), metaEdName: 'someDecimalParameter', isPartOfIdentity: false },
  ],
  data: {
    edfiApiSchema: {
      jsonSchemaForInsert: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        description: 'doc',
        properties: {
          uniqueId: {
            description: 'doc',
            maxLength: 30,
            type: 'string',
          },
          someBooleanParameter: {
            description: 'doc',
            type: 'boolean',
          },
          someIntegerParameter: {
            description: 'doc',
            type: 'integer',
          },
          someDecimalParameter: {
            description: 'doc',
            type: 'number',
          },
        },
        required: ['uniqueId'],
        title: 'EdFi.Student',
        type: 'object',
      },
      jsonSchemaForUpdate: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        description: 'doc',
        properties: {
          id: {
            description: 'The item id',
            type: 'string',
          },
          uniqueId: {
            description: 'doc',
            maxLength: 30,
            type: 'string',
          },
          someBooleanParameter: {
            description: 'doc',
            type: 'boolean',
          },
          someIntegerParameter: {
            description: 'doc',
            type: 'integer',
          },
          someDecimalParameter: {
            description: 'doc',
            type: 'number',
          },
        },
        required: ['id', 'uniqueId'],
        title: 'EdFi.Student',
        type: 'object',
      },
    },
  },
});

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
    expect(validationResult).toContain("Student does not include property 'one'");
  });

  it('should contain property `two`', () => {
    expect(validationResult).toContain("Student does not include property 'two'");
  });
});

describe('given a boolean query parameter value of true', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someBooleanParameter: 'true' };

    validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);
  });

  it('should have no errors', () => {
    expect(validationResult).toHaveLength(0);
  });
});

describe('given a boolean query parameter value of false', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someBooleanParameter: 'false' };

    validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);
  });

  it('should have no errors', () => {
    expect(validationResult).toHaveLength(0);
  });
});

describe('given a non boolean query parameter value for a boolean query parameter', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someBooleanParameter: 'yes' };

    validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);
  });

  it('should have one error', () => {
    expect(validationResult).toHaveLength(1);
  });

  it('should provide error message', () => {
    expect(validationResult).toMatchInlineSnapshot(`
      [
        "/someBooleanParameter must be boolean",
      ]
    `);
  });
});

describe('given a valid integer query parameter value', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someIntegerParameter: '100' };

    validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);
  });

  it('should have no errors', () => {
    expect(validationResult).toHaveLength(0);
  });
});

describe('given a decimal value for an integer query parameter', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someIntegerParameter: '100.10' };

    validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);
  });

  it('should have one error', () => {
    expect(validationResult).toHaveLength(1);
  });

  it('should provide error message', () => {
    expect(validationResult).toMatchInlineSnapshot(`
      [
        "/someIntegerParameter must be integer",
      ]
    `);
  });
});

describe('given a bad integer query parameter value', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someIntegerParameter: 'adsf' };

    validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);
  });

  it('should have one error', () => {
    expect(validationResult).toHaveLength(1);
  });

  it('should provide error message', () => {
    expect(validationResult).toMatchInlineSnapshot(`
      [
        "/someIntegerParameter must be integer",
      ]
    `);
  });
});

describe('given a valid decimal query parameter value', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someDecimalParameter: '100.10' };

    validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);
  });

  it('should have no errors', () => {
    expect(validationResult).toHaveLength(0);
  });
});

describe('given an integer value for a decimal query parameter value', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someDecimalParameter: '100' };

    validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);
  });

  it('should have no errors', () => {
    expect(validationResult).toHaveLength(0);
  });
});

describe('given a bad decimal query parameter value', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someDecimalParameter: 'adsf' };

    validationResult = validateQueryParametersAgainstSchema(createModel(), queryParameters);
  });

  it('should have one error', () => {
    expect(validationResult).toHaveLength(1);
  });

  it('should provide error message', () => {
    expect(validationResult).toMatchInlineSnapshot(`
      [
        "/someDecimalParameter must be number",
      ]
    `);
  });
});
