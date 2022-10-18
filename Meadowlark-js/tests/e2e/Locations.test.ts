// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken, Clients } from './functions/Credentials';
import { createResource, deleteResourceByLocation } from './functions/Resources';
import { createSchool } from './functions/Shared';
import { baseURLRequest, rootURLRequest } from './Setup';

describe('When creating a resource that has a reference to another resource', () => {
  describe('given a token with strict validation', () => {
    it('should fail when missing required properties', async () => {
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

    describe('given the reference does exist', () => {
      let schoolId: number;
      let schoolLocation: string;
      let location: string;

      beforeAll(async () => {
        schoolId = 100;
        schoolLocation = await createSchool(schoolId);
      });

      it('accepts the request', async () => {
        location = await createResource({
          endpoint: 'locations',
          body: {
            classroomIdentificationCode: 'string',
            schoolReference: {
              schoolId,
            },
            maximumNumberOfSeats: 20,
            optimalNumberOfSeats: 10,
          },
        });

        await rootURLRequest
          .get(location)
          .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
          .expect(200);
      });

      afterAll(async () => {
        await deleteResourceByLocation(location);

        await deleteResourceByLocation(schoolLocation);
      });
    });
  });

  describe('given a token with relaxed validation', () => {
    let location: string;

    it('should add the location', async () => {
      location = await createResource({
        endpoint: 'locations',
        credentials: Clients.Assessment1,
        body: {
          classroomIdentificationCode: 'string',
          schoolReference: {
            schoolId: 99,
          },
          maximumNumberOfSeats: 20,
          optimalNumberOfSeats: 10,
        },
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
      await deleteResourceByLocation(location);
    });
  });
});
