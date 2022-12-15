// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { createResource } from './Resources';

export async function createContentClassDescriptor(): Promise<string> {
  return createResource({
    endpoint: 'contentClassDescriptors',
    role: 'host',
    body: {
      codeValue: 'Presentation',
      description: 'Presentation',
      shortDescription: 'Presentation',
      namespace: 'uri://ed-fi.org/ContentClassDescriptor',
    },
  });
}

export async function createGradeLevelDescriptor(): Promise<string> {
  return createResource({
    endpoint: 'gradeLevelDescriptors',
    role: 'host',
    body: {
      codeValue: 'Eighth',
      description: 'Eight Grade',
      shortDescription: '8°',
      namespace: 'uri://ed-fi.org/GradeLevelDescriptor',
    },
  });
}

export async function createCountry(): Promise<string> {
  return createResource({
    endpoint: 'countryDescriptors',
    role: 'host',
    body: {
      codeValue: 'US',
      shortDescription: 'US',
      description: 'US',
      namespace: 'uri://ed-fi.org/CountryDescriptor',
    },
  });
}

export async function createSchool(schoolId: number): Promise<string> {
  // Using role that includes assessment credentials to bypass strict validation
  return createResource({
    endpoint: 'schools',
    role: 'host',
    body: {
      schoolId,
      nameOfInstitution: `New School ${schoolId}`,
      educationOrganizationCategories: [
        {
          educationOrganizationCategoryDescriptor: 'uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other',
        },
      ],
      schoolCategories: [
        {
          schoolCategoryDescriptor: 'uri://ed-fi.org/SchoolCategoryDescriptor#All Levels',
        },
      ],
      gradeLevels: [
        {
          gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#First Grade',
        },
      ],
    },
  });
}

export async function createStudent(studentUniqueId: string) {
  return createResource({
    endpoint: 'students',
    role: 'host',
    body: {
      studentUniqueId,
      birthDate: '2010-01-01',
      firstName: 'Automation',
      lastSurname: 'Student',
    },
  });
}
