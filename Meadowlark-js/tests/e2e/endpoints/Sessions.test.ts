// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createSchool } from '../helpers/DataCreation';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, getDescriptorByLocation, rootURLRequest } from '../helpers/Shared';

describe('Sessions', () => {
  describe('with strict validation', () => {
    it('should fail when missing required properties', async () => {
      await baseURLRequest()
        .post('/v3.3b/ed-fi/sessions')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .send({
          sessionName: 'd',
          schoolYearTypeReference: {
            schoolYear: 2034,
          },
          beginDate: '2021-01-01',
          endDate: '2021-06-01',
          termDescriptor: 'uri://ed-fi.org/fake-uri',
          totalInstructionalDays: 90,
          schoolReference: {
            schoolId: 99,
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
                      "schoolId": 99,
                    },
                    "resourceName": "School",
                  },
                  {
                    "identity": {
                      "descriptor": "uri://ed-fi.org/fake-uri",
                    },
                    "resourceName": "TermDescriptor",
                  },
                ],
                "message": "Reference validation failed",
              },
            }
          `);
        });
    });
  });

  describe('with a term', () => {
    let schoolId: number;
    let schoolLocation: string;
    let termDescriptorLocation: string;
    let termDescriptor: string;
    let sessionLocation: string;

    beforeEach(async () => {
      termDescriptorLocation = await createResource({
        endpoint: 'termDescriptors',
        body: {
          codeValue: 'Spring Semester',
          description: 'Spring Semester',
          shortDescription: 'Spring Semester',
          namespace: 'uri://ed-fi.org/TermDescriptor',
        },
      });

      termDescriptor = await getDescriptorByLocation(termDescriptorLocation);
      schoolId = 100;
      schoolLocation = await createSchool(schoolId);
    });

    it('should create a session', async () => {
      sessionLocation = await createResource({
        endpoint: 'sessions',
        body: {
          sessionName: 'd',
          schoolYearTypeReference: {
            schoolYear: 2034,
          },
          beginDate: '2021-01-01',
          endDate: '2021-06-01',
          termDescriptor,
          totalInstructionalDays: 90,
          schoolReference: {
            schoolId,
          },
        },
      });

      await baseURLRequest()
        .get('/v3.3b/ed-fi/sessions')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ termDescriptor })]));
        });

      await rootURLRequest()
        .get(sessionLocation)
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .expect(200);
    });

    afterEach(async () => {
      await deleteResourceByLocation(sessionLocation, 'session');
      await deleteResourceByLocation(termDescriptorLocation, 'termDescriptor');
      await deleteResourceByLocation(schoolLocation, 'school');
    });
  });
});
