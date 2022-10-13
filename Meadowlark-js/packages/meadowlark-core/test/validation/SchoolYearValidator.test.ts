// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { removeFromCache, updateCache } from '../../src/Environment';
import { getAllowedSchoolYears, validateDocument } from '../../src/validation/SchoolYearValidator';

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

describe('when validating a document', () => {
  const VALID_YEAR_1 = 2007;
  const VALID_YEAR_2 = 1902;
  const INVALID_YEAR = 3332;

  beforeAll(() => {
    updateCache('ALLOWED_SCHOOL_YEARS', [VALID_YEAR_1, VALID_YEAR_2]);
  });

  afterAll(() => {
    removeFromCache('ALLOWED_SCHOOL_YEARS');
  });

  describe('given the document does not contain anything like a school year', () => {
    // In theory this shouldn't be called in this circumstance, but we don't want it
    // to encounter any problems if it _is_ called.
    const body = {
      codeValue: 'Presentation',
      shortDescription: 'Presentation',
      description: 'Presentation',
      namespace: 'uri://ed-fi.org/ContentClassDescriptor',
    };

    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should be accepted', () => {
      expect(result).toBe('');
    });
  });

  describe('given a field called `schoolYear` that is not a schoolYearTypeReference', () => {
    const body = {
      schoolYear: INVALID_YEAR,
    };

    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should be accepted', () => {
      expect(result).toBe('');
    });
  });

  describe('given a plain schoolYearTypeReference with valid year', () => {
    const body = {
      schoolYearTypeReference: {
        schoolYear: VALID_YEAR_1,
      },
    };

    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should be accepted', () => {
      expect(result).toBe('');
    });
  });

  describe('given a plain schoolYearTypeReference with invalid year', () => {
    const body = {
      schoolYearTypeReference: {
        schoolYear: INVALID_YEAR,
      },
    };
    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should have an error message', () => {
      expect(result).not.toBe('');
    });

    it('should have a `message`', () => {
      expect(JSON.parse(result).message).not.toBe('');
    });

    it('should have a modelState', () => {
      expect(JSON.parse(result).modelState).toHaveProperty(['schoolYearTypeReference.schoolYear']);
    });
  });

  describe('given a role-named schoolYearTypeReference with valid year', () => {
    const body = {
      roleNamedSchoolYearTypeReference: {
        schoolYear: VALID_YEAR_2,
      },
    };
    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should be accepted', () => {
      expect(result).toBe('');
    });
  });

  describe('given a role-named schoolYearTypeReference with invalid year', () => {
    const body = {
      roleNamedSchoolYearTypeReference: {
        schoolYear: INVALID_YEAR,
      },
    };
    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should have an error message', () => {
      expect(result).not.toBe('');
    });

    it('should have a `message`', () => {
      expect(JSON.parse(result).message).not.toBe('');
    });

    it('should have a modelState', () => {
      expect(JSON.parse(result).modelState).toHaveProperty(['roleNamedSchoolYearTypeReference.schoolYear']);
    });
  });

  describe('given a schoolYear with valid value inside a common type', () => {
    const body = {
      cohortYear: {
        cohortYearTypeDescriptor: 'string',
        termDescriptor: 'string',
        schoolYearTypeReference: {
          schoolYear: VALID_YEAR_1,
        },
      },
    };

    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should be accepted', () => {
      expect(result).toBe('');
    });
  });

  describe('given a schoolYear with invalid value inside a common type', () => {
    const body = {
      cohortYear: {
        cohortYearTypeDescriptor: 'string',
        termDescriptor: 'string',
        schoolYearTypeReference: {
          schoolYear: INVALID_YEAR,
        },
      },
    };

    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should have an error message', () => {
      expect(result).not.toBe('');
    });

    it('should have a `message`', () => {
      expect(JSON.parse(result).message).not.toBe('');
    });

    it('should have a modelState', () => {
      expect(JSON.parse(result).modelState).toHaveProperty(['cohortYear.schoolYearTypeReference.schoolYear']);
    });
  });

  describe('given a schoolYear with valid value inside a common type with a role name', () => {
    const body = {
      cohortYear: {
        cohortYearTypeDescriptor: 'string',
        termDescriptor: 'string',
        cohortSchoolYearTypeReference: {
          schoolYear: VALID_YEAR_1,
        },
      },
    };

    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should be accepted', () => {
      expect(result).toBe('');
    });
  });

  describe('given a schoolYear with invalid value inside a common type with a role name', () => {
    const body = {
      cohortYear: {
        cohortYearTypeDescriptor: 'string',
        termDescriptor: 'string',
        cohortSchoolYearTypeReference: {
          schoolYear: INVALID_YEAR,
        },
      },
    };

    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should have an error message', () => {
      expect(result).not.toBe('');
    });

    it('should have a `message`', () => {
      expect(JSON.parse(result).message).not.toBe('');
    });

    it('should have a modelState', () => {
      expect(JSON.parse(result).modelState).toHaveProperty(['cohortYear.cohortSchoolYearTypeReference.schoolYear']);
    });
  });

  describe('given a schoolYear collection with valid values', () => {
    const body = {
      schoolYears: [
        {
          schoolYearTypeReference: {
            schoolYear: VALID_YEAR_1,
          },
        },
        {
          schoolYearTypeReference: {
            schoolYear: VALID_YEAR_2,
          },
        },
      ],
    };

    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should be accepted', () => {
      expect(result).toBe('');
    });
  });

  describe('given a schoolYear collection with an invalid value', () => {
    const body = {
      schoolYears: [
        {
          schoolYearTypeReference: {
            schoolYear: VALID_YEAR_1,
          },
        },
        {
          schoolYearTypeReference: {
            schoolYear: INVALID_YEAR,
          },
        },
      ],
    };

    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should have an error message', () => {
      expect(result).not.toBe('');
    });

    it('should have a `message`', () => {
      expect(JSON.parse(result).message).not.toBe('');
    });

    it('should have a modelState', () => {
      expect(JSON.parse(result).modelState).toHaveProperty(['schoolYears.1.schoolYearTypeReference.schoolYear']);
    });
  });

  describe('given a common with a common with a role-named collection of school years, one of which is invalid', () => {
    const body = {
      outerCommon: {
        innerCommon: {
          schoolYears: [
            {
              cohortSchoolYearTypeReference: {
                schoolYear: INVALID_YEAR,
              },
            },
          ],
        },
      },
    };

    let result: string;

    beforeAll(() => {
      result = validateDocument(body);
    });

    it('should have an error message', () => {
      expect(result).not.toBe('');
    });

    it('should have a `message`', () => {
      expect(JSON.parse(result).message).not.toBe('');
    });

    it('should have a modelState', () => {
      expect(JSON.parse(result).modelState).toHaveProperty([
        'outerCommon.innerCommon.schoolYears.0.cohortSchoolYearTypeReference.schoolYear',
      ]);
    });
  });
});
