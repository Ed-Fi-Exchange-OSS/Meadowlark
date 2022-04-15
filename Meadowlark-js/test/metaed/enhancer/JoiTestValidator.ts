// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// Validate against Joi schemas
// eslint-disable-next-line import/no-import-module-exports
import { expect } from '@hapi/code';

const thrownAt = () => {
  const error = new Error();
  const frame = error.stack
    ?.replace(error.toString(), '')
    ?.split('\n')
    ?.slice(1)
    ?.filter((line) => !line.includes(__filename))[0];
  const at = frame?.match(/^\s*at \(?(.+):(\d+):(\d+)\)?$/);
  return {
    filename: at?.[1],
    line: at?.[2],
    column: at?.[3],
  };
};

export const validate = (schema, _prefs, _tests?) => {
  const tests = _tests == null ? _prefs : _tests;
  const prefs = _tests == null ? null : _prefs;

  try {
    expect(schema.$_root.build(schema.describe())).to.equal(schema, { deepFunction: true, skip: ['$_temp'] });
    // eslint-disable-next-line no-restricted-syntax
    for (const test of tests) {
      const [input, pass, expected] = test;
      if (!pass) {
        expect(expected, 'Failing tests messages must be tested').to.exist();
      }

      const { error: errord, value: valued } = schema.validate(input, { debug: true, ...prefs });
      const { error, value } = schema.validate(input, prefs);

      expect(error).to.equal(errord);
      expect(value).to.equal(valued);

      if (error && pass) {
        // eslint-disable-next-line no-console
        console.log(error);
      }

      if (!error && !pass) {
        // eslint-disable-next-line no-console
        console.log(input);
      }

      expect(!error).to.equal(pass);

      if (test.length === 2) {
        if (pass) {
          expect(input).to.equal(value);
        }
        // eslint-disable-next-line no-continue
        continue;
      }

      if (pass) {
        if (expected !== exports.skip) {
          expect(value).to.equal(expected);
        }
        // eslint-disable-next-line no-continue
        continue;
      }

      if (typeof expected === 'string') {
        expect(error.message).to.equal(expected);
        // eslint-disable-next-line no-continue
        continue;
      }

      // eslint-disable-next-line no-underscore-dangle
      if ((schema._preferences && schema._preferences.abortEarly === false) || (prefs && prefs.abortEarly === false)) {
        expect(error.message).to.equal(expected.message);
        expect(error.details).to.equal(expected.details);
      } else {
        expect(error.details).to.have.length(1);
        expect(error.message).to.equal(error.details[0].message);
        expect(error.details[0]).to.equal(expected);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err.stack);
    err.at = thrownAt(); // Adjust error location to test
    throw err;
  }
};
