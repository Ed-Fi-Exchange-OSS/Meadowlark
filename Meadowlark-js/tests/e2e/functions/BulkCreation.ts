// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { createSchool } from './DataCreation';
import { deleteResourceByLocation } from './Resources';

export async function createSchoolsInBulk(total: number): Promise<Array<string>> {
  const schools: Array<string> = [];
  // eslint-disable-next-line no-plusplus
  for (let current = 0; current < total; current++) {
    schools.push(await createSchool(current));
  }

  return schools;
}

export async function deleteListOfResources(locations: Array<string>): Promise<void> {
  // eslint-disable-next-line no-restricted-syntax
  for (const location of locations) {
    await deleteResourceByLocation(location);
  }
}
