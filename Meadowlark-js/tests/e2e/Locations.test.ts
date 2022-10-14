// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { baseURLRequest, getAccessToken, Clients, rootURLRequest, deleteByLocation } from './SharedFunctions';

describe('Locations', () => {
  describe('with strict validation', () => {
    it('should fail when missing data', async () => {
      await baseURLRequest
        .post('/v3.3b/ed-fi/locations')
        .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
        .send({
          classroomIdentificationCode: 'string',
          schoolReference: {
            schoolId: 99,
          },
          maximumNumberOfSeats: 20,
          optimalNumberOfSeats: 10,
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain('Resource School is missing identity');
        });
    });
  });

  describe('without strict validation', () => {
    let location: string;

    it('should add the association', async () => {
      location = await baseURLRequest
        .post('/v3.3b/ed-fi/locations')
        .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
        .send({
          classroomIdentificationCode: 'string',
          schoolReference: {
            schoolId: 99,
          },
          maximumNumberOfSeats: 20,
          optimalNumberOfSeats: 10,
        })
        .expect(201)
        .then((response) => {
          expect(response.headers.location).not.toBe(null);
          return response.headers.location;
        });

      await rootURLRequest
        .get(location)
        .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              schoolReference: {
                schoolId: 99,
              },
            }),
          );
        });
    });

    afterAll(async () => {
      await deleteByLocation(location);
    });
  });
});
