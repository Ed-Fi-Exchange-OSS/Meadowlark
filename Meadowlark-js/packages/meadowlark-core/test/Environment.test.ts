// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import exp from 'constants';
import { clearCache, getFromCache, getValueFromEnvironment, removeFromCache, updateCache } from '../src/Environment';

describe('when getting an environment variables', () => {
  const { env } = process;

  beforeAll(() => {
    jest.resetModules();
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  describe('given a variable that has been configured', () => {
    it('returns the value as a string', () => {
      const EXPECTED = 'a signing key';
      process.env.SIGNING_KEY = EXPECTED;
      const result = getValueFromEnvironment('SIGNING_KEY');

      expect(result).toBe(EXPECTED);
    });
  });

  describe('given a missing variable', () => {
    it('throws an error', () => {
      delete process.env.SIGNING_KEY;
      expect(() => getValueFromEnvironment('SIGNING_KEY')).toThrowError();
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
      updateCache('ALLOWED_SCHOOL_YEARS', INSERT);

      let stored = getFromCache<number[]>('ALLOWED_SCHOOL_YEARS');
      expect(stored).toBe(INSERT);

      updateCache('ALLOWED_SCHOOL_YEARS', UPDATE);
      stored = getFromCache<number[]>('ALLOWED_SCHOOL_YEARS');
      expect(stored).toBe(UPDATE);

      removeFromCache('ALLOWED_SCHOOL_YEARS');

      stored = getFromCache<number[]>('ALLOWED_SCHOOL_YEARS');
      expect(stored).toBeUndefined();

      expect(() => removeFromCache('ALLOWED_SCHOOL_YEARS')).not.toThrowError('expect no error despite key not existing');
    });
  });
});
