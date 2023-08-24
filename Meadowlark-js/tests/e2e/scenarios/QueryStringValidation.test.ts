// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { createSchoolsInBulk, deleteListOfResources } from '../helpers/BulkCreation';
import { getAccessToken } from '../helpers/Credentials';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest } from '../helpers/Shared';

describe('When retrieving information', () => {
  describe("given there's no data", () => {
    it('should return the total count', async () => {
      await baseURLRequest()
        .get('/v3.3b/ed-fi/schools')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.headers['total-count']).toEqual('0');
          expect(response.body).toMatchInlineSnapshot(`[]`);
        });
    });
  });

  describe('when querying with filters', () => {
    const total = 10;
    let schools: Array<string>;

    beforeAll(async () => {
      const bulkCreation = await createSchoolsInBulk(total);
      if (bulkCreation.errors) {
        throw new Error('Error creating schools');
      }
      schools = bulkCreation.resources;
    });

    describe('when querying changing the casing of the query value to be all lowercase', () => {
      it('should return correct result', async () => {
        await baseURLRequest()
          .get(`/v3.3b/ed-fi/schools?nameOfInstitution=new school 1`)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.headers['total-count']).toEqual('1');
          });
      });
    });

    describe('when querying changing the casing of the query value to be all uppercase', () => {
      it('should return correct result', async () => {
        await baseURLRequest()
          .get(`/v3.3b/ed-fi/schools?nameOfInstitution=NEW SCHOOL 1`)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.headers['total-count']).toEqual('1');
          });
      });
    });

    describe('when querying with limit', () => {
      describe('when getting less than total', () => {
        // Use the assessment1 credentials to bypass additional validations
        it('should return the total and a subset of the results', async () => {
          const limit = total - 1;
          await baseURLRequest()
            .get(`/v3.3b/ed-fi/schools?limit=${limit}`)
            .auth(await getAccessToken('host'), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.headers['total-count']).toEqual(`${total}`);
              expect(response.body.length).toEqual(limit);
            });
        });
      });

      describe('when requesting with invalid values', () => {
        // Use the assessment1 credentials to bypass additional validations
        it.each([-1, 'zero', '5; select * from users', '0)', '1%27'])('limit = %s', async (limit) => {
          await baseURLRequest()
            .get(`/v3.3b/ed-fi/schools?limit=${limit}`)
            .auth(await getAccessToken('host'), { type: 'bearer' })
            .expect(400)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(`
                  {
                    "error": "The request is invalid.",
                    "modelState": {
                      "limit": [
                        "Must be set to a numeric value >= 0",
                      ],
                      "offset": [],
                    },
                  }
                `);
            });
        });
      });
    });

    describe('when querying with limit and offset', () => {
      describe('when getting a valid offset', () => {
        // Use the assessment1 credentials to bypass additional validations
        it('should return the total and a subset of the results', async () => {
          const offset = total / 2;
          await baseURLRequest()
            .get(`/v3.3b/ed-fi/schools?limit=${total}&offset=${offset}`)
            .auth(await getAccessToken('host'), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.headers['total-count']).toEqual(`${total}`);
              expect(response.body.length).toEqual(total - offset);
            });
        });
      });

      describe('when using an offset greater than the total', () => {
        it('should return empty list', async () => {
          const offset = total + 1;
          await baseURLRequest()
            .get(`/v3.3b/ed-fi/schools?limit=${total}&offset=${offset}`)
            .auth(await getAccessToken('host'), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.headers['total-count']).toEqual(`${total}`);
              expect(response.body.length).toEqual(0);
              expect(response.body).toMatchInlineSnapshot(`[]`);
            });
        });
      });

      describe('when requesting with invalid values', () => {
        // Use the assessment1 credentials to bypass additional validations
        it.each([-1, 'zero', '5; select * from users', '0)', '1%27'])('offset = %s', async (offset) => {
          await baseURLRequest()
            .get(`/v3.3b/ed-fi/schools?limit=${total}&offset=${offset}`)
            .auth(await getAccessToken('host'), { type: 'bearer' })
            .expect(400)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(`
                  {
                    "error": "The request is invalid.",
                    "modelState": {
                      "limit": [],
                      "offset": [
                        "Must be set to a numeric value >= 0",
                      ],
                    },
                  }
                `);
            });
        });
      });

      describe('when using limit without offset', () => {
        // Use the assessment1 credentials to bypass additional validations
        it('should return an error message', async () => {
          const offset = total - (total - 1);
          await baseURLRequest()
            .get(`/v3.3b/ed-fi/schools?offset=${offset}`)
            .auth(await getAccessToken('host'), { type: 'bearer' })
            .expect(400)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(`
                  {
                    "error": "The request is invalid.",
                    "modelState": {
                      "limit": [
                        "Limit must be provided when using offset",
                      ],
                      "offset": [],
                    },
                  }
                `);
            });
        });
      });
    });

    describe('when querying with limit and including property', () => {
      it('should return the total and a subset of the results', async () => {
        const limit = total - 5;
        const schoolName = 'New School 0';
        await baseURLRequest()
          .get(`/v3.3b/ed-fi/schools?limit=${limit}&nameOfInstitution=${schoolName}`)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.headers['total-count']).toEqual(`${1}`);
            expect(response.body.length).toEqual(1);
            expect(response.body).toEqual(
              expect.arrayContaining([expect.objectContaining({ nameOfInstitution: schoolName })]),
            );
          });
      });
    });

    afterAll(async () => {
      await deleteListOfResources(schools, 'schools');
    });
  });

  describe('when querying by data types', () => {
    let academicWeekLocation: string;
    const data = {
      weekIdentifier: '12d3e5$',
      schoolReference: {
        schoolId: 100,
      },
      beginDate: '2020-01-01',
      endDate: '2021-01-01',
      totalInstructionalDays: 50,
    };

    beforeAll(async () => {
      academicWeekLocation = await createResource({
        endpoint: 'academicWeeks',
        role: 'host',
        body: data,
      });
    });

    describe('when querying by date', () => {
      describe('when date is valid', () => {
        it('should return valid data', async () => {
          await baseURLRequest()
            .get(`/v3.3b/ed-fi/academicWeeks?beginDate=${data.beginDate}`)
            .auth(await getAccessToken('host'), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.body.length).toBeGreaterThan(0);
              expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining(data)]));
            });
        });
      });

      describe('when date is invalid', () => {
        const wrongDate = '2020/01/01';
        it('should return error message', async () => {
          await baseURLRequest()
            .get(`/v3.3b/ed-fi/academicWeeks?beginDate=${wrongDate}`)
            .auth(await getAccessToken('host'), { type: 'bearer' })
            .expect(400)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(`
                {
                  "error": "The request is invalid.",
                  "modelState": {
                    "/beginDate must match format "date"": "Invalid property",
                  },
                }
              `);
            });
        });
      });

      describe('when date is out of specified dates', () => {
        const oldDate = data.beginDate.replace('2020', '2010');
        it('should return empty array', async () => {
          await baseURLRequest()
            .get(`/v3.3b/ed-fi/academicWeeks?beginDate=${oldDate}`)
            .auth(await getAccessToken('host'), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(`[]`);
            });
        });
      });

      describe('when begin date specified is end date', () => {
        it('should return empty array', async () => {
          await baseURLRequest()
            .get(`/v3.3b/ed-fi/academicWeeks?beginDate=${data.endDate}`)
            .auth(await getAccessToken('host'), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(`[]`);
            });
        });
      });
    });

    describe('when querying by string identifier', () => {
      it('should return valid data', async () => {
        await baseURLRequest()
          .get(`/v3.3b/ed-fi/academicWeeks?weekIdentifier=${data.weekIdentifier}`)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining(data)]));
          });
      });
    });

    describe('when querying by integer', () => {
      it('should return valid data', async () => {
        await baseURLRequest()
          .get(`/v3.3b/ed-fi/academicWeeks?totalInstructionalDays=${data.totalInstructionalDays}`)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining(data)]));
          });
      });
    });

    afterAll(async () => {
      await deleteResourceByLocation(academicWeekLocation, 'academicWeek');
    });
  });
});
