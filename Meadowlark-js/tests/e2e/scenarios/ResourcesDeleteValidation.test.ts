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
import { rootURLRequest } from '../helpers/Shared';

describe('given a DELETE of a non-existent school', () => {
  const endpoint = 'schools';
  const schoolId = 'some_not_existing_school_id';

  it('should return not found from delete', async () => {
    await rootURLRequest()
      .delete(`/local/v3.3b/ed-fi/${endpoint}/${schoolId}`)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(404);
  });
});

describe('given a DELETE of an school', () => {
  const schoolId = 100;
  let schoolLocation: string;

  beforeAll(async () => {
    await createeducationOrganizationCategoryDescriptor();
    await createGradeLevelDescriptor();

    schoolLocation = await createSchool(schoolId);
  });

  it('should return delete success', async () => {
    await rootURLRequest()
      .delete(schoolLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .then((response) => {
        expect(response.status).toEqual(204);
      });
  });

  it('should return not found from get', async () => {
    await rootURLRequest()
      .get(schoolLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(404);
  });
});
