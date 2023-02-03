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
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('given a POST of a school with empty body', () => {
  const endpoint = 'schools';

  it('should return errors', async () => {
    await baseURLRequest()
      .post(`/v3.3b/ed-fi/${endpoint}`)
      .send('{}')
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(400)
      .then((response) => {
        expect(response.body).toMatchInlineSnapshot(`
        {
          "error": [
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'schoolId'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'gradeLevels'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'nameOfInstitution'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'educationOrganizationCategories'",
              "path": "{requestBody}",
            },
          ],
        }
      `);
      });
  });
});

describe('given a POST of a school followed by a second POST of the school with a changed field', () => {
  const schoolId = 1000;
  let schoolUpdateReponse: any;
  let schoolLocation: string;
  const endpoint = 'schools';

  const schoolUpdateBody = `{
    "schoolId": ${schoolId},
    "gradeLevels": [
      {
          "gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#First Grade"
      }
    ],
    "nameOfInstitution": "Updated School ${schoolId}",
    "educationOrganizationCategories": [
      {
        "educationOrganizationCategoryDescriptor": "uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other"
      }
    ]
  }`;

  beforeAll(async () => {
    await createeducationOrganizationCategoryDescriptor();
    await createGradeLevelDescriptor();

    schoolLocation = await createSchool(schoolId);

    await baseURLRequest()
      .post(`/v3.3b/ed-fi/${endpoint}`)
      .send(schoolUpdateBody)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(200)
      .then((response) => {
        schoolUpdateReponse = response;
      });
  });

  it('should return insert success', async () => {
    await rootURLRequest()
      .get(schoolUpdateReponse.headers.location)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            nameOfInstitution: `Updated School ${schoolId}`,
          }),
        );
      });
  });

  afterAll(async () => {
    await deleteResourceByLocation(schoolLocation);
  });
});
