// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EnvironmentVariable, getFromCache, getValueFromEnvironment, updateCache } from '../Environment';
import { SchoolYearEnumerationDocument } from '../model/SchoolYearEnumerationDocument';
import { SchoolYearReferenceDocument } from '../model/SchoolYearReferenceDocument';

const ALLOWED_SCHOOL_YEARS: EnvironmentVariable = 'ALLOWED_SCHOOL_YEARS';

/**
 * List of allowed school years.
 * @returns
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
export function validateDocument(body: SchoolYearReferenceDocument): string {
  const { schoolYear } = (body as SchoolYearReferenceDocument).schoolYearTypeReference as SchoolYearEnumerationDocument;

  const isAllowedYear = getAllowedSchoolYears().some((y: number) => y === schoolYear);

  if (isAllowedYear) {
    return '';
  }

  return JSON.stringify({
    message: `Invalid school year ${schoolYear}`,
    modelState: {
      'schoolYearReference.schoolYear': ['invalid value'],
    },
  });
}
