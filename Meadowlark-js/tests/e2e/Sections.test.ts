// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  baseURLRequest,
  getAccessToken,
  Clients,
  deleteByLocation,
  rootURLRequest,
  createResource,
} from './SharedFunctions';

describe('Sections', () => {
  describe('with strict validation', () => {
    it('should fail when missing data', async () => {
      await baseURLRequest
        .post('/v3.3b/ed-fi/sections')
        .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
        .send({
          sectionIdentifier: 'c00v',
          courseOfferingReference: {
            localCourseCode: 'abc',
            schoolId: 666,
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
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain('Resource ClassPeriod is missing identity');
          expect(response.body.message).toContain('Resource CourseOffering is missing identity');
          expect(response.body.message).toContain('Resource Location is missing identity');
          expect(response.body.message).toContain('Resource CreditTypeDescriptor is missing identity');
        });
    });
  });

  describe('without strict validation', () => {
    let location: string;

    it('should add the section', async () => {
      location = await createResource({
        endpoint: 'sections',
        credentials: Clients.Assessment1,
        body: {
          sectionIdentifier: 'c00v',
          courseOfferingReference: {
            localCourseCode: 'abc',
            schoolId: 666,
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

      await rootURLRequest
        .get(location)
        .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
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
      await deleteByLocation(location);
    });
  });
});
