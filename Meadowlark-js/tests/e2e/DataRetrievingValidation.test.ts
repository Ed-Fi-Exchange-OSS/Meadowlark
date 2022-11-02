// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { createSchoolsInBulk, deleteListOfResources } from './functions/BulkCreation';
import { Clients, getAccessToken } from './functions/Credentials';
import { baseURLRequest } from './Setup';

describe('When retrieving information', () => {
  describe('when retrieving total count', () => {
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

      describe('when limiting to less than total', () => {
        // Use the assessment1 credentials to bypass additional validations
        it('should return the total and a subset of the results', async () => {
          const limit = total - 5;
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

      afterAll(async () => {
        await deleteListOfResources(schools);
      });
    });
  });
});
