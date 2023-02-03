// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import {
  createeducationOrganizationCategoryDescriptor,
  createGradeLevelDescriptor,
  createSchool,
} from '../helpers/DataCreation';
import { deleteResourceByLocation } from '../helpers/Resources';
import { rootURLRequest } from '../helpers/Shared';

describe('given a GET of an existent school', () => {
  const schoolId = 100;
  let schoolLocation: string;

  beforeAll(async () => {
    await createeducationOrganizationCategoryDescriptor();
    await createGradeLevelDescriptor();

    schoolLocation = await createSchool(schoolId);
  });

  it('should return school', async () => {
    await rootURLRequest()
      .get(schoolLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            schoolId: 100,
            nameOfInstitution: `New School ${schoolId}`,
          }),
        );
      });
  });

  afterAll(async () => {
    await deleteResourceByLocation(schoolLocation);
  });
});

describe('given a GET of a non-existent school', () => {
  const endpoint = 'schools';
  const schoolId = 'some_not_existing_school_id';

  it('should return not found from delete', async () => {
    await rootURLRequest()
      .get(`/local/v3.3b/ed-fi/${endpoint}/${schoolId}`)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(404);
  });
});
