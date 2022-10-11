// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { removeFromCache, updateCache } from '../../src/Environment';
import { getAllowedSchoolYears } from '../../src/validation/SchoolYearValidator';

describe('when reading school years from the environment', () => {
  const { env } = process;

  beforeAll(() => {
    jest.resetModules();
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
    removeFromCache('ALLOWED_SCHOOL_YEARS');
  });

  describe('given school years have already been loaded into env cache', () => {
    let result: number[] = [2023];

    beforeAll(() => {
      updateCache('ALLOWED_SCHOOL_YEARS', result);

      process.env.ALLOWED_SCHOOL_YEARS = 'this will not be read';
      result = getAllowedSchoolYears();
    });

    it('should return a list with one item', () => {
      expect(result).toHaveLength(1);
    });

    it('should return the correct year', () => {
      expect(result[0]).toBe(2023);
    });
  });

  describe('given a single school year', () => {
    let result: number[];

    beforeAll(() => {
      process.env.ALLOWED_SCHOOL_YEARS = '2022';
      result = getAllowedSchoolYears();
    });

    it('should return a list with one item', () => {
      expect(result).toHaveLength(1);
    });

    it('should return the correct year', () => {
      expect(result[0]).toBe(2022);
    });
  });

  describe('given three school years', () => {
    let result: number[];

    beforeAll(() => {
      process.env.ALLOWED_SCHOOL_YEARS = '2022, 2134, 3459';
      result = getAllowedSchoolYears();
    });

    it('should return a list with three items', () => {
      expect(result).toHaveLength(3);
    });

    it.each([
      [0, 2022],
      [1, 2134],
      [2, 3459],
    ])('should have %s : %s', (i: number, year: number) => {
      expect(result[i]).toBe(year);
    });
  });

  describe('given no school years', () => {
    let result: number[];

    beforeAll(() => {
      process.env.ALLOWED_SCHOOL_YEARS = '';
      result = getAllowedSchoolYears();
    });

    it('should return a list with no items', () => {
      expect(result).toHaveLength(0);
    });
  });

  describe('given an invalid school year', () => {
    let result: number[];

    beforeAll(() => {
      process.env.ALLOWED_SCHOOL_YEARS = '202. 20234';
      result = getAllowedSchoolYears();
    });

    it('should return a list with no items', () => {
      expect(result).toHaveLength(0);
    });
  });
});
