// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('Sections', () => {
  describe('with strict validation', () => {
    it('should fail when missing data', async () => {
      await baseURLRequest()
        .post('/v3.3b/ed-fi/sections')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .send({
          sectionIdentifier: 'c00v',
          courseOfferingReference: {
            localCourseCode: 'abc',
            schoolId: 66,
            sessionName: 'd',
            schoolYear: 2034,
          },
          locationReference: {
            classroomIdentificationCode: '1',
            schoolId: 2,
          },
          availableCreditTypeDescriptor: 'k',
          classPeriods: [
            {
              classPeriodReference: {
                schoolId: 66,
                classPeriodName: 'z1',
              },
            },
            {
              classPeriodReference: {
                schoolId: 66,
                classPeriodName: 'z2',
              },
            },
          ],
        })
        .expect(409)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": {
                "failures": [
                  {
                    "identity": {
                      "classPeriodName": "z1",
                      "schoolReference.schoolId": 66,
                    },
                    "resourceName": "ClassPeriod",
                  },
                  {
                    "identity": {
                      "classPeriodName": "z2",
                      "schoolReference.schoolId": 66,
                    },
                    "resourceName": "ClassPeriod",
                  },
                  {
                    "identity": {
                      "localCourseCode": "abc",
                      "schoolReference.schoolId": 66,
                      "sessionReference.schoolId": 66,
                      "sessionReference.schoolYear": 2034,
                      "sessionReference.sessionName": "d",
                    },
                    "resourceName": "CourseOffering",
                  },
                  {
                    "identity": {
                      "classroomIdentificationCode": "1",
                      "schoolReference.schoolId": 2,
                    },
                    "resourceName": "Location",
                  },
                  {
                    "identity": {
                      "descriptor": "k",
                    },
                    "resourceName": "CreditTypeDescriptor",
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
    let sectionLocation: string;

    it('should add the section', async () => {
      sectionLocation = await createResource({
        endpoint: 'sections',
        role: 'host',
        body: {
          sectionIdentifier: 'c00v',
          courseOfferingReference: {
            localCourseCode: 'abc',
            schoolId: 66,
            sessionName: 'd',
            schoolYear: 2034,
          },
          locationReference: {
            classroomIdentificationCode: '1',
            schoolId: 2,
          },
          availableCreditTypeDescriptor: 'k',
          classPeriods: [
            {
              classPeriodReference: {
                schoolId: 66,
                classPeriodName: 'z1',
              },
            },
            {
              classPeriodReference: {
                schoolId: 66,
                classPeriodName: 'z2',
              },
            },
          ],
        },
      });

      await rootURLRequest()
        .get(sectionLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              sectionIdentifier: 'c00v',
            }),
          );
        });
    });

    afterAll(async () => {
      await deleteResourceByLocation(sectionLocation, 'section');
    });
  });
});
