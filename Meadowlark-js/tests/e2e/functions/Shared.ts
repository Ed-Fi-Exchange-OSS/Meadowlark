// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { chance, rootURLRequest } from '../Setup';
import { Clients, getAccessToken } from './Credentials';
import { createResource } from './Resources';

export function generateRandomId(length = 12): string {
  return chance.hash({ length });
}

/* TEMPORARY LOCATION */

export async function createContentClassDescriptor(): Promise<string> {
  return createResource({
    endpoint: 'contentClassDescriptors',
    credentials: Clients.Host1,
    body: {
      codeValue: 'Presentation',
      shortDescription: 'Presentation',
      description: 'Presentation',
      namespace: 'uri://ed-fi.org/ContentClassDescriptor',
    },
  });
}

export async function createCountry(): Promise<string> {
  return createResource({
    endpoint: 'countryDescriptors',
    credentials: Clients.Host1,
    body: {
      codeValue: 'US',
      shortDescription: 'US',
      description: 'US',
      namespace: 'uri://ed-fi.org/CountryDescriptor',
    },
  });
}

export async function createSchool(schoolId: number): Promise<string> {
  // Using assessment credentials to bypass strict validation
  return createResource({
    endpoint: 'schools',
    credentials: Clients.Assessment1,
    body: {
      schoolId,
      nameOfInstitution: 'New School',
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

export async function getDescriptorByLocation(location: string): Promise<string> {
  return rootURLRequest
    .get(location)
    .auth(await getAccessToken(Clients.Host1), { type: 'bearer' })
    .expect(200)
    .then((response) => {
      expect(response.body).not.toBe(null);
      return `${response.body.namespace}#${response.body.description}`;
    });
}

/* TEMPORARY LOCATION */
