// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { createSchool } from './DataCreation';
import { deleteResourceByLocation } from './Resources';

type Resources = {
  resources: Array<string>;

  errors: boolean;
};

export async function createSchoolsInBulk(total: number): Promise<Resources> {
  const schools: Array<string> = [];
  let errorCreating = false;

  for (let current = 0; current < total; current += 1) {
    try {
      schools.push(await createSchool(current));
    } catch (error) {
      console.error(error);
      errorCreating = true;
    }
  }

  return {
    resources: schools,
    errors: errorCreating,
  } as Resources;
}

export async function deleteListOfResources(locations: Array<string>, resourceName: string): Promise<void> {
  // eslint-disable-next-line no-restricted-syntax
  for (const location of locations) {
    await deleteResourceByLocation(location, resourceName);
  }
}
