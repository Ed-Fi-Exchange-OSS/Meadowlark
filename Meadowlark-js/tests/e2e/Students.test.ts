// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  baseURLRequest,
  createCountry,
  deleteByLocation,
  generateRandomId,
  getAccessToken,
  getDescriptorByLocation,
  rootURLRequest,
} from './SharedFunctions';

describe('Students', () => {
  describe('with strict validation', () => {
    let countryLocation: string;
    let countryDescriptor: string;
    let studentLocation: string;

    beforeAll(async () => {
      countryLocation = await createCountry();
      countryDescriptor = await getDescriptorByLocation(countryLocation);
    });

    it('should fail with invalid country descriptor', async () => {
      await baseURLRequest
        .post('/v3.3b/ed-fi/students')
        .auth(await getAccessToken('client1'), { type: 'bearer' })
        .send({
          studentUniqueId: generateRandomId(),
          firstName: 'First',
          lastSurname: 'Last',
          birthDate: '2001-01-01',
          birthCountryDescriptor: 'uri://ed-fi.org/CountryDescriptor#AD3',
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain('Resource CountryDescriptor is missing identity');
        });
    });

    it('should allow valid country descriptor', async () => {
      studentLocation = await baseURLRequest
        .post('/v3.3b/ed-fi/students')
        .auth(await getAccessToken('client1'), { type: 'bearer' })
        .send({
          studentUniqueId: generateRandomId(),
          firstName: 'First',
          lastSurname: 'Last',
          birthDate: '2001-01-01',
          birthCountryDescriptor: countryDescriptor,
        })
        .expect(201)
        .then((response) => {
          expect(response.headers.location).not.toBe(null);
          return response.headers.location;
        });

      await rootURLRequest
        .get(studentLocation)
        .auth(await getAccessToken('client1'), { type: 'bearer' })
        .expect(200);
    });

    afterAll(async () => {
      if (studentLocation) {
        await deleteByLocation(studentLocation);
      }

      if (countryLocation) {
        await deleteByLocation(countryLocation);
      }
    });
  });

  describe('without strict validation', () => {
    let studentLocation: string;
    const client = 'client4';

    it('should allow invalid country', async () => {
      studentLocation = await baseURLRequest
        .post('/v3.3b/ed-fi/students')
        .auth(await getAccessToken(client), { type: 'bearer' })
        .send({
          studentUniqueId: generateRandomId(),
          firstName: 'First',
          lastSurname: 'Last',
          birthDate: '2001-01-01',
          birthCountryDescriptor: 'uri://ed-fi.org/CountryDescriptor#AD3',
        })
        .expect(201)
        .then((response) => {
          expect(response.headers.location).not.toBe(null);
          return response.headers.location;
        });

      await rootURLRequest
        .get(studentLocation)
        .auth(await getAccessToken(client), { type: 'bearer' })
        .expect(200);
    });

    afterAll(async () => {
      if (studentLocation) {
        await deleteByLocation(studentLocation, client);
      }
    });
  });

  // TBD: Create test for student created with one credential accessed by another
});
