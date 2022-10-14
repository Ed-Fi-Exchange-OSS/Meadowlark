// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  clearCache,
  getBooleanFromEnvironment,
  getFloatFromEnvironment,
  getFromCache,
  getIntegerFromEnvironment,
  getStringFromEnvironment,
  removeFromCache,
  updateCache,
} from '../src/Environment';

describe('when getting an environment variable', () => {
  const { env } = process;

  beforeAll(() => {
    jest.resetModules();
  });

  afterAll(() => {
    process.env = env;
  });

  describe('given requesting a string', () => {
    const EXPECTED_STRING = 'a signing key';

    describe('given a variable that has been configured', () => {
      describe('given it has not been cached', () => {
        let result: string;

        beforeAll(() => {
          process.env = {};
          clearCache();

          process.env.SIGNING_KEY = EXPECTED_STRING;

          result = getStringFromEnvironment('SIGNING_KEY');
        });

        it('returns the value as a string', () => {
          expect(result).toBe(EXPECTED_STRING);
        });

        it('has been cached', () => {
          expect(getFromCache('SIGNING_KEY')).toBe(EXPECTED_STRING);
        });
      });

      describe('given it has been cached', () => {
        const EXPECTED = 'a signing key';
        let result: string;

        beforeAll(() => {
          process.env = {};
          clearCache();

          // Ensure we're not re-reading the environment variable
          process.env.SIGNING_KEY = 'something unexpected';
          updateCache('SIGNING_KEY', EXPECTED);

          result = getStringFromEnvironment('SIGNING_KEY');
        });

        it('returns the value as a string', () => {
          expect(result).toBe(EXPECTED);
        });
      });
    });

    describe('given a variable that has not been configured', () => {
      describe('given no default value', () => {
        it('throws an error', () => {
          process.env = {};
          clearCache();

          expect(() => getStringFromEnvironment('SIGNING_KEY')).toThrowError();
        });
      });

      describe('given a default value', () => {
        let result: string;

        beforeAll(() => {
          process.env = {};
          clearCache();

          result = getStringFromEnvironment('SIGNING_KEY', EXPECTED_STRING);
        });

        it('throws an error', () => {
          expect(result).toBe(EXPECTED_STRING);
        });
      });
    });
  });

  describe('when getting a floating point environment variable', () => {
    const EXPECTED = 344.3355;

    describe('given it has been configured', () => {
      let result: number;

      beforeAll(() => {
        process.env = {};
        clearCache();

        process.env.SIGNING_KEY = EXPECTED.toString();
        result = getFloatFromEnvironment('SIGNING_KEY');
      });

      it('returns the value', () => {
        expect(result).toBe(EXPECTED);
      });

      it('has been cached', () => {
        expect(getFromCache('SIGNING_KEY')).not.toBeUndefined();
      });
    });

    describe('given it has not been configured', () => {
      describe('given no default value', () => {
        it('throws an error', () => {
          process.env = {};
          clearCache();

          expect(() => getFloatFromEnvironment('SIGNING_KEY')).toThrowError();
        });
      });

      describe('given there is a default value', () => {
        let result: number;

        beforeAll(() => {
          process.env = {};
          clearCache();

          result = getFloatFromEnvironment('SIGNING_KEY', EXPECTED);
        });

        it('returns the value as a string', () => {
          expect(result).toBe(EXPECTED);
        });

        it('has been cached', () => {
          expect(getFromCache('SIGNING_KEY')).toBe(EXPECTED);
        });
      });
    });
  });

  describe('when getting an integer environment variable', () => {
    const EXPECTED = 344;

    describe('given it has been configured', () => {
      let result: number;

      beforeAll(() => {
        process.env = {};
        clearCache();

        process.env.SIGNING_KEY = EXPECTED.toString();
        result = getIntegerFromEnvironment('SIGNING_KEY');
      });

      it('returns the value', () => {
        expect(result).toBe(EXPECTED);
      });

      it('has been cached', () => {
        expect(getFromCache('SIGNING_KEY')).not.toBeUndefined();
      });
    });

    describe('given it has not been configured', () => {
      describe('given no default value', () => {
        it('throws an error', () => {
          process.env = {};
          clearCache();

          expect(() => getIntegerFromEnvironment('SIGNING_KEY')).toThrowError();
        });
      });

      describe('given there is a default value', () => {
        let result: number;

        beforeAll(() => {
          process.env = {};
          clearCache();

          result = getIntegerFromEnvironment('SIGNING_KEY', EXPECTED);
        });

        it('returns the value', () => {
          expect(result).toBe(EXPECTED);
        });

        it('has been cached', () => {
          expect(getFromCache('SIGNING_KEY')).toBe(EXPECTED);
        });
      });
    });
  });

  describe('when getting an integer environment variable', () => {
    const EXPECTED = true;

    describe('given it has been configured', () => {
      let result: boolean;

      beforeAll(() => {
        process.env = {};
        clearCache();

        process.env.SIGNING_KEY = EXPECTED.toString();
        result = getBooleanFromEnvironment('SIGNING_KEY');
      });

      it('returns the value', () => {
        expect(result).toBe(EXPECTED);
      });

      it('has been cached', () => {
        expect(getFromCache('SIGNING_KEY')).not.toBeUndefined();
      });
    });

    describe('given it has not been configured', () => {
      describe('given no default value', () => {
        it('throws an error', () => {
          process.env = {};
          clearCache();

          expect(() => getBooleanFromEnvironment('SIGNING_KEY')).toThrowError();
        });
      });

      describe('given there is a default value', () => {
        let result: boolean;

        beforeAll(() => {
          process.env = {};
          clearCache();

          result = getBooleanFromEnvironment('SIGNING_KEY', EXPECTED);
        });

        it('returns the value', () => {
          expect(result).toBe(EXPECTED);
        });

        it('has been cached', () => {
          expect(getFromCache('SIGNING_KEY')).toBe(EXPECTED);
        });
      });
    });
  });

  describe('when using the environment cache', () => {
    describe('given happy path usage', () => {
      it('works as expected', () => {
        // This is a bit lazy, because the code is so simple that it is not worth setting up mocks

        const INSERT = [1];
        const UPDATE = [2];

        clearCache();
        updateCache('BEGIN_ALLOWED_SCHOOL_YEAR', INSERT);

        let stored = getFromCache<number[]>('BEGIN_ALLOWED_SCHOOL_YEAR');
        expect(stored).toBe(INSERT);

        updateCache('BEGIN_ALLOWED_SCHOOL_YEAR', UPDATE);
        stored = getFromCache<number[]>('BEGIN_ALLOWED_SCHOOL_YEAR');
        expect(stored).toBe(UPDATE);

        removeFromCache('BEGIN_ALLOWED_SCHOOL_YEAR');

        stored = getFromCache<number[]>('BEGIN_ALLOWED_SCHOOL_YEAR');
        expect(stored).toBeUndefined();

        expect(() => removeFromCache('BEGIN_ALLOWED_SCHOOL_YEAR')).not.toThrowError(
          'expect no error despite key not existing',
        );
      });
    });
  });
});
