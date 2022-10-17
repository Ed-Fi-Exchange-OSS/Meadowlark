// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  baseURLRequest,
  Clients,
  createCountry,
  deleteByLocation,
  generateRandomId,
  getAccessToken,
  getDescriptorByLocation,
  rootURLRequest,
} from './SharedFunctions';

describe('Students', () => {
  describe('with strict validation', () => {
    it('should fail with invalid country descriptor', async () => {
      await baseURLRequest
        .post('/v3.3b/ed-fi/students')
        .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
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
  });

  describe('without strict validation', () => {
    let studentLocation: string;

    it('should allow invalid country', async () => {
      studentLocation = await baseURLRequest
        .post('/v3.3b/ed-fi/students')
        .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
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
        .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
        .expect(200);
    });

    afterAll(async () => {
      await deleteByLocation(studentLocation);
    });
  });

  describe('when country is added', () => {
    let countryLocation: string;
    let countryDescriptor: string;
    let studentLocation: string;

    beforeAll(async () => {
      countryLocation = await createCountry();
      countryDescriptor = await getDescriptorByLocation(countryLocation);
    });

    it('should allow adding student', async () => {
      studentLocation = await baseURLRequest
        .post('/v3.3b/ed-fi/students')
        .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
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
        .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
        .expect(200);
    });

    describe('when editing a student', () => {
      const studentUniqueId = generateRandomId();
      beforeAll(async () => {
        studentLocation = await baseURLRequest
          .post('/v3.3b/ed-fi/students')
          .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
          .send({
            studentUniqueId,
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
      });

      it('should allow to edit', async () => {
        await rootURLRequest
          .put(studentLocation)
          .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
          .send({
            studentUniqueId,
            firstName: 'First',
            lastSurname: 'Last',
            birthDate: '2000-01-01',
            birthCountryDescriptor: countryDescriptor,
          })
          .expect(204);

        await baseURLRequest
          .get('/v3.3b/ed-fi/students')
          .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ studentUniqueId })]));
          });

        await rootURLRequest
          .get(studentLocation)
          .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(expect.objectContaining({ birthDate: '2000-01-01' }));
          });
      });
    });

    afterEach(async () => {
      await deleteByLocation(studentLocation);
    });

    afterAll(async () => {
      await deleteByLocation(countryLocation);
    });
  });
});
