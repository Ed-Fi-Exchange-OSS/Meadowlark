// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config, Environment, getBooleanFromEnvironment } from '@edfi/meadowlark-utilities';
import { ResourceSchema, newResourceSchema } from '../../src/model/api-schema/ResourceSchema';
import { ValidationFailure, validateDocument } from '../../src/validation/DocumentValidator';

const originalGetBooleanFromEnvironment = getBooleanFromEnvironment;
function createResourceSchema(): ResourceSchema {
  return {
    ...newResourceSchema(),
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
  };
}

describe('given body insert with allow overposting is false have two invalid properties and a valid one', () => {
  let validationResult: ValidationFailure | null;

  beforeAll(() => {
    const bodyParameters = { uniqueId: 'a', one: 'one', two: 'two' };
    jest.clearAllMocks();
    jest.spyOn(Environment, 'getBooleanFromEnvironment').mockImplementation((key: Config.ConfigKeys) => {
      if (key === 'ALLOW_OVERPOSTING') {
        return false;
      }
      return originalGetBooleanFromEnvironment(key, false);
    });
    validationResult = validateDocument(createResourceSchema(), bodyParameters);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return validation errors', () => {
    expect(validationResult).toMatchInlineSnapshot(`
      {
        "error": [
          {
            "context": {
              "errorType": "additionalProperties",
            },
            "message": "'one' property is not expected to be here",
            "path": "{requestBody}",
          },
          {
            "context": {
              "errorType": "additionalProperties",
            },
            "message": "'two' property is not expected to be here",
            "path": "{requestBody}",
          },
        ],
      }
    `);
  });
});

describe('given body update with allow overposting is false have two invalid properties and a valid one', () => {
  let validationResult: ValidationFailure | null;

  beforeAll(() => {
    const bodyParameters = { id: '1', uniqueId: 'a', one: 'one', two: 'two' };
    jest.clearAllMocks();
    jest.spyOn(Environment, 'getBooleanFromEnvironment').mockImplementation((key: Config.ConfigKeys) => {
      if (key === 'ALLOW_OVERPOSTING') {
        return false;
      }
      return originalGetBooleanFromEnvironment(key, false);
    });
    validationResult = validateDocument(createResourceSchema(), bodyParameters, true);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return validation errors', () => {
    expect(validationResult).toMatchInlineSnapshot(`
      {
        "error": [
          {
            "context": {
              "errorType": "additionalProperties",
            },
            "message": "'one' property is not expected to be here",
            "path": "{requestBody}",
          },
          {
            "context": {
              "errorType": "additionalProperties",
            },
            "message": "'two' property is not expected to be here",
            "path": "{requestBody}",
          },
        ],
      }
    `);
  });
});

describe.skip('given body insert with allow overposting is true have two invalid properties and a valid one', () => {
  let validationResult: ValidationFailure | null;

  beforeAll(() => {
    const bodyParameters = { uniqueId: 'a', one: 'one', two: 'two' };
    jest.clearAllMocks();
    jest.spyOn(Environment, 'getBooleanFromEnvironment').mockImplementation((key: Config.ConfigKeys) => {
      if (key === 'ALLOW_OVERPOSTING') {
        return true;
      }
      return originalGetBooleanFromEnvironment(key, false);
    });
    validationResult = validateDocument(createResourceSchema(), bodyParameters);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should not have errors', () => {
    expect(validationResult).toBeNull();
  });
});

describe.skip('given body update with allow overposting is true have two invalid properties and a valid one', () => {
  let validationResult: ValidationFailure | null;

  beforeAll(() => {
    const bodyParameters = { id: '1', uniqueId: 'a', one: 'one', two: 'two' };
    jest.clearAllMocks();
    jest.spyOn(Environment, 'getBooleanFromEnvironment').mockImplementation((key: Config.ConfigKeys) => {
      if (key === 'ALLOW_OVERPOSTING') {
        return true;
      }
      return originalGetBooleanFromEnvironment(key, false);
    });
    validationResult = validateDocument(createResourceSchema(), bodyParameters, true);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should not have errors', () => {
    expect(validationResult).toBeNull();
  });
});
