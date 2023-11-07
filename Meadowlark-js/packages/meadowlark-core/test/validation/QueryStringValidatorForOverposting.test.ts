// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config, Environment, getBooleanFromEnvironment } from '@edfi/meadowlark-utilities';
import { ResourceSchema, newResourceSchema } from '../../src/model/api-schema/ResourceSchema';
import { validateQueryParameters } from '../../src/validation/QueryStringValidator';
import { ValidationFailure, validateDocument } from '../../src/validation/DocumentValidator';

const originalGetBooleanFromEnvironment = getBooleanFromEnvironment;
function createResourceSchema(): ResourceSchema {
  return {
    ...newResourceSchema(),
    jsonSchemaForQuery: {
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
      title: 'EdFi.Student',
      type: 'object',
    },
  };
}

describe('given query parameters with allow overposting is false have two invalid properties and a valid one', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { uniqueId: 'a', one: 'one', two: 'two' };
    jest.clearAllMocks();
    jest.spyOn(Environment, 'getBooleanFromEnvironment').mockImplementation((key: Config.ConfigKeys) => {
      if (key === 'ALLOW_OVERPOSTING') {
        return false;
      }
      return originalGetBooleanFromEnvironment(key, false);
    });
    validationResult = validateQueryParameters(createResourceSchema(), queryParameters);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should have two errors', () => {
    expect(validationResult).toHaveLength(2);
  });

  it('should contain property `one`', () => {
    expect(validationResult).toContain(" does not include property 'one'");
  });

  it('should contain property `two`', () => {
    expect(validationResult).toContain(" does not include property 'two'");
  });
});

describe('given query parameters with allow overposting is true have two extraneous properties and a valid one', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { uniqueId: 'a', one: 'one', two: 'two' };
    jest.clearAllMocks();
    jest.spyOn(Environment, 'getBooleanFromEnvironment').mockImplementation((key: Config.ConfigKeys) => {
      if (key === 'ALLOW_OVERPOSTING') {
        return true;
      }
      return originalGetBooleanFromEnvironment(key, false);
    });
    validationResult = validateQueryParameters(createResourceSchema(), queryParameters);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should have two errors', () => {
    expect(validationResult).toHaveLength(2);
  });

  it('should contain property `one`', () => {
    expect(validationResult).toContain(" does not include property 'one'");
  });

  it('should contain property `two`', () => {
    expect(validationResult).toContain(" does not include property 'two'");
  });
});

describe('given a boolean query parameter value of true', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someBooleanParameter: 'true' };

    validationResult = validateQueryParameters(createResourceSchema(), queryParameters);
  });

  it('should have no errors', () => {
    expect(validationResult).toHaveLength(0);
  });
});

describe('given a boolean query parameter value of false', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someBooleanParameter: 'false' };

    validationResult = validateQueryParameters(createResourceSchema(), queryParameters);
  });

  it('should have no errors', () => {
    expect(validationResult).toHaveLength(0);
  });
});

describe('given a non boolean query parameter value for a boolean query parameter', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someBooleanParameter: 'yes' };

    validationResult = validateQueryParameters(createResourceSchema(), queryParameters);
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

    validationResult = validateQueryParameters(createResourceSchema(), queryParameters);
  });

  it('should have no errors', () => {
    expect(validationResult).toHaveLength(0);
  });
});

describe('given a decimal value for an integer query parameter', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someIntegerParameter: '100.10' };

    validationResult = validateQueryParameters(createResourceSchema(), queryParameters);
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

    validationResult = validateQueryParameters(createResourceSchema(), queryParameters);
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

    validationResult = validateQueryParameters(createResourceSchema(), queryParameters);
  });

  it('should have no errors', () => {
    expect(validationResult).toHaveLength(0);
  });
});

describe('given an integer value for a decimal query parameter value', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someDecimalParameter: '100' };

    validationResult = validateQueryParameters(createResourceSchema(), queryParameters);
  });

  it('should have no errors', () => {
    expect(validationResult).toHaveLength(0);
  });
});

describe('given a bad decimal query parameter value', () => {
  let validationResult: string[];

  beforeAll(() => {
    const queryParameters = { someDecimalParameter: 'adsf' };

    validationResult = validateQueryParameters(createResourceSchema(), queryParameters);
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

  it('should have three errors', () => {
    expect(validationResult?.error).toHaveLength(3);
  });

  it('should return validation errors', () => {
    expect(validationResult?.error).toMatchInlineSnapshot(`
    [
      {
        "context": {
          "errorType": "additionalProperties",
        },
        "message": "'uniqueId' property is not expected to be here",
        "path": "{requestBody}",
      },
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
    ]
    `);
  });
});

describe('given body update with allow overposting is false have two invalid properties and a valid one', () => {
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
    validationResult = validateDocument(createResourceSchema(), bodyParameters, true);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should have three errors', () => {
    expect(validationResult?.error).toHaveLength(3);
  });

  it('should return validation errors', () => {
    expect(validationResult?.error).toMatchInlineSnapshot(`
    [
      {
        "context": {
          "errorType": "additionalProperties",
        },
        "message": "'uniqueId' property is not expected to be here",
        "path": "{requestBody}",
      },
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
    ]
    `);
  });
});

describe('given body insert with allow overposting is true have two invalid properties and a valid one', () => {
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

describe('given body update with allow overposting is true have two invalid properties and a valid one', () => {
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
    validationResult = validateDocument(createResourceSchema(), bodyParameters, true);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should not have errors', () => {
    expect(validationResult).toBeNull();
  });
});
