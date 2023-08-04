// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('given schoolId is an equality constraint on Section between CourseOffering and ClassPeriods', () => {
  it('should fail when CourseOffering schoolId is a mismatch with a single ClassPeriod', async () => {
    await baseURLRequest()
      .post('/v3.3b/ed-fi/sections')
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .send({
        sectionIdentifier: 'sectionIdentifier',
        courseOfferingReference: {
          localCourseCode: 'localCourseCode',
          schoolId: 6,
          sessionName: 'sessionName',
          schoolYear: 2020,
        },
        classPeriods: [
          {
            classPeriodReference: {
              schoolId: 6666,
              classPeriodName: 'classPeriodName1',
            },
          },
        ],
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toMatchInlineSnapshot(`
          {
            "error": [
              "Constraint failure: document paths $.classPeriods[*].classPeriodReference.schoolId and $.courseOfferingReference.schoolId must have the same values",
            ],
          }
        `);
      });
  });

  it('should fail when CourseOffering schoolId is a mismatch with two ClassPeriods', async () => {
    await baseURLRequest()
      .post('/v3.3b/ed-fi/sections')
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .send({
        sectionIdentifier: 'sectionIdentifier',
        courseOfferingReference: {
          localCourseCode: 'localCourseCode',
          schoolId: 6,
          sessionName: 'sessionName',
          schoolYear: 2020,
        },
        classPeriods: [
          {
            classPeriodReference: {
              schoolId: 6666,
              classPeriodName: 'classPeriodName1',
            },
          },
          {
            classPeriodReference: {
              schoolId: 6666,
              classPeriodName: 'classPeriodName2',
            },
          },
        ],
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toMatchInlineSnapshot(`
          {
            "error": [
              "Constraint failure: document paths $.classPeriods[*].classPeriodReference.schoolId and $.courseOfferingReference.schoolId must have the same values",
            ],
          }
        `);
      });
  });

  it('should fail when CourseOffering schoolId is a mismatch with one ClassPeriod but a match with another', async () => {
    await baseURLRequest()
      .post('/v3.3b/ed-fi/sections')
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .send({
        sectionIdentifier: 'sectionIdentifier',
        courseOfferingReference: {
          localCourseCode: 'localCourseCode',
          schoolId: 6,
          sessionName: 'sessionName',
          schoolYear: 2020,
        },
        classPeriods: [
          {
            classPeriodReference: {
              schoolId: 6,
              classPeriodName: 'classPeriodName1',
            },
          },
          {
            classPeriodReference: {
              schoolId: 6666,
              classPeriodName: 'classPeriodName2',
            },
          },
        ],
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toMatchInlineSnapshot(`
          {
            "error": [
              "Constraint failure: document paths $.classPeriods[*].classPeriodReference.schoolId and $.courseOfferingReference.schoolId must have the same values",
            ],
          }
        `);
      });
  });
});

describe('given schoolId is an equality constraint on Section between CourseOffering and ClassPeriods ', () => {
  let sectionLocation: string;

  it('should succeed when there are no ClassPeriods as they are optional', async () => {
    sectionLocation = await createResource({
      endpoint: 'sections',
      role: 'host',
      body: {
        sectionIdentifier: 'sectionIdentifier',
        courseOfferingReference: {
          localCourseCode: 'localCourseCode',
          schoolId: 6,
          sessionName: 'sessionName',
          schoolYear: 2020,
        },
        classPeriods: [
          {
            classPeriodReference: {
              schoolId: 6,
              classPeriodName: 'classPeriodName1',
            },
          },
          {
            classPeriodReference: {
              schoolId: 6,
              classPeriodName: 'classPeriodName2',
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
            sectionIdentifier: 'sectionIdentifier',
          }),
        );
      });
  });

  afterAll(async () => {
    await deleteResourceByLocation(sectionLocation, 'section');
  });
});

describe('given equality constraint do not apply when an optional element is not present', () => {
  let sectionLocation: string;

  it('should succeed when there are no ClassPeriods as they are optional', async () => {
    sectionLocation = await createResource({
      endpoint: 'sections',
      role: 'host',
      body: {
        sectionIdentifier: 'sectionIdentifier',
        courseOfferingReference: {
          localCourseCode: 'localCourseCode',
          schoolId: 6,
          sessionName: 'sessionName',
          schoolYear: 2020,
        },
      },
    });

    await rootURLRequest()
      .get(sectionLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            sectionIdentifier: 'sectionIdentifier',
          }),
        );
      });
  });

  afterAll(async () => {
    await deleteResourceByLocation(sectionLocation, 'section');
  });
});
