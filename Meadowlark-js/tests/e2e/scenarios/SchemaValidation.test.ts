// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken, Clients } from '../helpers/Credentials';
import { baseURLRequest } from '../helpers/Shared';

describe('When creating a resource', () => {
  describe('given a missing property on a required collection', () => {
    it('should fail with message about the missing property', async () => {
      // This is entirely missing the "categories" collection
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken(Clients.Vendor), { type: 'bearer' })
        .send({
          communityOrganizationId: 19,
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: 'CIS',
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor:
                'uri://ed-fi.org/EducationOrganizationIdentificationSystemDescriptor#SEA',
              identificationCode: '19',
            },
          ],
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toMatchInlineSnapshot(`
            [
              {
                "context": {
                  "errorType": "required",
                },
                "message": "{requestBody} must have required property 'categories'",
                "path": "{requestBody}",
              },
            ]
          `);
        });
    });
  });

  describe('given an empty array on a required collection', () => {
    it('should fail with message about the missing property', async () => {
      // This is has a "categories" array, but it is empty
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken(Clients.Vendor), { type: 'bearer' })
        .send({
          categories: [],
          communityOrganizationId: 19,
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: 'CIS',
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor:
                'uri://ed-fi.org/EducationOrganizationIdentificationSystemDescriptor#SEA',
              identificationCode: '19',
            },
          ],
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toMatchInlineSnapshot(`
            [
              {
                "context": {
                  "errorType": "minItems",
                },
                "message": "property 'categories' must not have fewer than 1 items",
                "path": "{requestBody}.categories",
              },
            ]
          `);
        });
    });
  });

  describe('given an empty descriptor value', () => {
    it('should fail with a message about the descriptor', async () => {
      // educationOrganizationIdentificationSystemDescriptor: '',
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken(Clients.Vendor), { type: 'bearer' })
        .send({
          communityOrganizationId: 19,
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: 'CIS',
          addresses: [],
          categories: [
            {
              educationOrganizationCategoryDescriptor: 'abc',
            },
          ],
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor: '',
              identificationCode: '19',
            },
          ],
          indicators: [],
          institutionTelephones: [],
          internationalAddresses: [],
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toMatchInlineSnapshot(
            `"Reference validation failed: Resource EducationOrganizationCategory is missing identity {"descriptor":"abc"}"`,
          );
        });
    });
  });

  describe('given an empty required string value', () => {
    it('should fail with a message about the property', async () => {
      // shortNameOfInstitution: '',
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken(Clients.Vendor), { type: 'bearer' })
        .send({
          communityOrganizationId: 19,
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: '',
          addresses: [],
          categories: [
            {
              educationOrganizationCategoryDescriptor: 'abc',
            },
          ],
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor: 'def',
              identificationCode: '19',
            },
          ],
          indicators: [],
          institutionTelephones: [],
          internationalAddresses: [],
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toMatchInlineSnapshot(`
            [
              {
                "context": {
                  "errorType": "minLength",
                },
                "message": "property 'shortNameOfInstitution' must not have fewer than 1 characters",
                "path": "{requestBody}.shortNameOfInstitution",
              },
            ]
          `);
        });
    });
  });

  describe('given a missing number property', () => {
    it('should fail with a message about the property', async () => {
      // communityOrganizationId
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken(Clients.Vendor), { type: 'bearer' })
        .send({
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: 'CIS',
          addresses: [],
          categories: [
            {
              educationOrganizationCategoryDescriptor: 'abc',
            },
          ],
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor: 'def',
              identificationCode: '19',
            },
          ],
          indicators: [],
          institutionTelephones: [],
          internationalAddresses: [],
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toMatchInlineSnapshot(`
            [
              {
                "context": {
                  "errorType": "required",
                },
                "message": "{requestBody} must have required property 'communityOrganizationId'",
                "path": "{requestBody}",
              },
            ]
          `);
        });
    });
  });

  describe('given empty arrays on optional collections', () => {
    it('should fail on reference validation instead of schema validation', async () => {
      // In other words, empty arrays are acceptable!
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken(Clients.Vendor), { type: 'bearer' })
        .send({
          communityOrganizationId: 19,
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: 'CIS',
          addresses: [],
          categories: [
            {
              educationOrganizationCategoryDescriptor: 'abc',
            },
          ],
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor: 'def',
              identificationCode: '19',
            },
          ],
          indicators: [],
          institutionTelephones: [],
          internationalAddresses: [],
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toMatchInlineSnapshot(
            `"Reference validation failed: Resource EducationOrganizationCategory is missing identity {"descriptor":"abc"}"`,
          );
        });
    });
  });

  describe('given an incorrect date format', () => {
    it('should return error message', async () => {
      await baseURLRequest()
        .post(`/v3.3b/ed-fi/academicWeeks`)
        .auth(await getAccessToken(Clients.Host), { type: 'bearer' })
        .send({
          weekIdentifier: '123456',
          schoolReference: {
            schoolId: 100,
          },
          beginDate: 'January 1st, 2020',
          endDate: '2020/12/01',
          totalInstructionalDays: 50,
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toMatchInlineSnapshot(`
            [
              {
                "context": {
                  "errorType": "format",
                },
                "message": "property 'beginDate' must match format 'date'",
                "path": "{requestBody}.beginDate",
              },
              {
                "context": {
                  "errorType": "format",
                },
                "message": "property 'endDate' must match format 'date'",
                "path": "{requestBody}.endDate",
              },
            ]
          `);
        });
    });
  });
});
