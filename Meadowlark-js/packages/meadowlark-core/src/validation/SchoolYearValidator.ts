// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { EnvironmentVariable, getFromCache, getValueFromEnvironment, updateCache } from '../Environment';
// import { SchoolYearEnumerationDocument } from '../model/SchoolYearEnumerationDocument';
// import { SchoolYearReferenceDocument } from '../model/SchoolYearReferenceDocument';

const ALLOWED_SCHOOL_YEARS: EnvironmentVariable = 'ALLOWED_SCHOOL_YEARS';

/**
 * List of allowed school years.
 */
export function getAllowedSchoolYears(): number[] {
  const cached = getFromCache<[number]>(ALLOWED_SCHOOL_YEARS);
  if (cached) {
    return cached;
  }

  const config = getValueFromEnvironment(ALLOWED_SCHOOL_YEARS);

  const list = config
    .split(',')
    .map((y: string) => (/^\d+$/.test(y.trim()) ? Number.parseInt(y, 10) : NaN))
    .filter((n: number) => !Number.isNaN(n));

  updateCache(ALLOWED_SCHOOL_YEARS, list);

  return list;
}

/**
 * Validates any fields of type `SchoolYear` by comparing to the list of configured school years.
 *
 * Validates the request body for the resource. If invalid, returns an error message.
 */
export function validateDocument(body: object): string {
  const isAllowedYear = (schoolYear: number): boolean => getAllowedSchoolYears().some((y: number) => y === schoolYear);
  const isSchoolYearTypeReference = (key: string): boolean => key.toLowerCase().endsWith('schoolyeartypereference');
  const isCommon = (key: string, value: object): boolean => !key.toLowerCase().endsWith('reference') && R.is(Object, value);
  const isCollection = (key: string, value: object): boolean =>
    !key.toLowerCase().endsWith('schoolyears') && R.is(Array, value);

  const huntForSchoolYearViolations = (start: object, path: string): string[] => {
    const errors: string[] = [];

    R.keys(start).forEach((key: string) => {
      const inner = start[key];
      if (isSchoolYearTypeReference(key)) {
        if ('schoolYear' in inner) {
          if (!isAllowedYear(inner.schoolYear)) {
            errors.push(`${path}${key}.schoolYear`);
          }
        }
      } else if (isCommon(key, inner)) {
        errors.push(...huntForSchoolYearViolations(inner, `${path}${key}.`));
      } else if (isCollection(key, inner)) {
        const collection = inner as Array<object>;
        for (let i = 0; i < collection.length; i += 1) {
          errors.push(...huntForSchoolYearViolations(collection[i], `${path}${key}[${i}].`));
        }
      }
    });

    return errors;
  };

  const errors = huntForSchoolYearViolations(body, '');

  if (errors.length === 0) {
    return '';
  }

  return JSON.stringify({
    message: `Contains one or more invalid school year`,
    modelState: errors.reduce((a, v) => ({ ...a, [v]: ['invalid value'] }), {}),
  });
}
