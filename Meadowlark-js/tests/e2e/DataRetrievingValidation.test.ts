// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { createSchoolsInBulk, deleteListOfResources } from './functions/BulkCreation';
import { Clients, getAccessToken } from './functions/Credentials';
import { baseURLRequest } from './Setup';

describe('When retrieving information', () => {
  describe("when there's no data", () => {
    it('should return the total count', async () => {
      await baseURLRequest
        .get('/v3.3b/ed-fi/schools')
        .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.headers['total-count']).toEqual('0');
          expect(response.body).toMatchInlineSnapshot(`[]`);
        });
    });
  });

  describe('when data is present', () => {
    const total = 10;
    let schools: Array<string>;

    beforeAll(async () => {
      schools = await createSchoolsInBulk(total);
    });

    describe('when using limit', () => {
      describe('when getting less than total', () => {
        // Use the assessment1 credentials to bypass additional validations
        it('should return the total and a subset of the results', async () => {
          const limit = total - 1;
          await baseURLRequest
            .get(`/v3.3b/ed-fi/schools?limit=${limit}`)
            .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(+response.headers['total-count']).toEqual(total);
              expect(response.body.length).toEqual(limit);
            });
        });
      });

      describe('when requesting with invalid values', () => {
        // Use the assessment1 credentials to bypass additional validations
        it.each([0, 'zero'])('limit = %s', async (limit) => {
          await baseURLRequest
            .get(`/v3.3b/ed-fi/schools?limit=${limit}`)
            .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
            .expect(400)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(`
                  {
                    "message": "The request is invalid.",
                    "modelState": {
                      "limit": [
                        "Must be set to a numeric value >= 1",
                      ],
                    },
                  }
                `);
            });
        });
      });
    });

    describe('when using limit with offset', () => {
      describe('when getting a valid offset', () => {
        // Use the assessment1 credentials to bypass additional validations
        it('should return the total and a subset of the results', async () => {
          const offset = total / 2;
          await baseURLRequest
            .get(`/v3.3b/ed-fi/schools?limit=${total}&offset=${offset}`)
            .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(+response.headers['total-count']).toEqual(total);
              expect(response.body.length).toEqual(total - offset);
            });
        });
      });

      describe('when using an offset bigger than the total', () => {
        it('should return empty list', async () => {
          const offset = total + 1;
          await baseURLRequest
            .get(`/v3.3b/ed-fi/schools?limit=${total}&offset=${offset}`)
            .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(+response.headers['total-count']).toEqual(total);
              // Confirm correctness
              expect(response.body.length).toEqual(0);
              expect(response.body).toMatchInlineSnapshot(`[]`);
            });
        });
      });

      describe('when requesting with invalid values', () => {
        // Use the assessment1 credentials to bypass additional validations
        it.each([0, 'zero'])('offset = %s', async (offset) => {
          await baseURLRequest
            .get(`/v3.3b/ed-fi/schools?limit=${total}&offset=${offset}`)
            .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
            .expect(400)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(`
                  {
                    "message": "The request is invalid.",
                    "modelState": {
                      "offset": [
                        "Must be set to a numeric value >= 1",
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
          await baseURLRequest
            .get(`/v3.3b/ed-fi/schools?offset=${offset}`)
            .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
            .expect(400)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(`
                  {
                    "message": "The request is invalid.",
                    "modelState": {
                      "limit": [
                        "Limit must be provided when using offset",
                      ],
                    },
                  }
                `);
            });
        });
      });

      afterAll(async () => {
        await deleteListOfResources(schools);
      });
    });
  });
});
