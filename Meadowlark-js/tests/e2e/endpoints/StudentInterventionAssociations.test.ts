// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('Student Intervention Association', () => {
  describe('with strict validation', () => {
    it('should fail when missing data', async () => {
      await baseURLRequest()
        .post('/v3.3b/ed-fi/StudentInterventionAssociations')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .send({
          studentReference: {
            studentUniqueId: 's0zf6d1123d3e',
          },
          interventionReference: {
            interventionIdentificationCode: '111',
            educationOrganizationId: 123,
          },
        })
        .expect(409)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": {
                "failures": [
                  {
                    "identity": {
                      "educationOrganizationReference.educationOrganizationId": 123,
                      "interventionIdentificationCode": "111",
                    },
                    "resourceName": "Intervention",
                  },
                  {
                    "identity": {
                      "studentUniqueId": "s0zf6d1123d3e",
                    },
                    "resourceName": "Student",
                  },
                ],
                "message": "Reference validation failed",
              },
            }
          `);
        });
    });
  });

  describe('without strict validation', () => {
    let associationLocation: string;

    it('should add the association', async () => {
      associationLocation = await createResource({
        endpoint: 'StudentInterventionAssociations',
        role: 'host',
        body: {
          studentReference: {
            studentUniqueId: 's0zf6d1123d3e',
          },
          interventionReference: {
            interventionIdentificationCode: '111',
            educationOrganizationId: 123,
          },
        },
      });

      await rootURLRequest()
        .get(associationLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              studentReference: {
                studentUniqueId: 's0zf6d1123d3e',
              },
            }),
          );
        });
    });

    afterAll(async () => {
      await deleteResourceByLocation(associationLocation, 'StudentInterventionAssociations');
    });
  });
});
