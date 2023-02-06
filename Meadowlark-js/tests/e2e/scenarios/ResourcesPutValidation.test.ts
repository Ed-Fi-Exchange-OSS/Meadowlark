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

describe('given a POST of a school followed by the PUT of the school with a changed field', () => {
  const schoolId = 1000;
  let schoolLocation: string;

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
  });

  it('should return put success', async () => {
    await rootURLRequest()
      .put(schoolLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .send(schoolUpdateBody)
      .expect(204);
  });

  it('should return updated field', async () => {
    await rootURLRequest()
      .get(schoolLocation)
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

describe('given a PUT of the school with empty body', () => {
  const schoolId = 1000;
  let schoolLocation: string;

  beforeAll(async () => {
    await createeducationOrganizationCategoryDescriptor();
    await createGradeLevelDescriptor();

    schoolLocation = await createSchool(schoolId);
  });

  it('should return put failure with errors', async () => {
    await rootURLRequest()
      .put(schoolLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .send('{}')
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

  afterAll(async () => {
    await deleteResourceByLocation(schoolLocation);
  });
});

describe('given a POST of a school followed by the PUT of the school with a different identity', () => {
  const schoolId = 1000;
  let schoolLocation: string;

  const schoolUpdateBody = `{
    "schoolId": ${schoolId + 1},
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
  });

  it('should return put failure', async () => {
    await rootURLRequest()
      .put(schoolLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .send(schoolUpdateBody)
      .expect(400)
      .then((response) => {
        expect(response.body).toMatchInlineSnapshot(`
        {
          "error": "The identity of the resource does not match the identity in the updated document.",
        }
        `);
      });
  });

  afterAll(async () => {
    await deleteResourceByLocation(schoolLocation);
  });
});
