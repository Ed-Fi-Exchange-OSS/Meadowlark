// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createCountry } from '../helpers/DataCreation';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, generateRandomId, getDescriptorByLocation, rootURLRequest } from '../helpers/Shared';

describe('When creating a resource that has a reference to a descriptor', () => {
  describe('given a token with strict validation', () => {
    describe('given reference does not exist', () => {
      it('should fail with code 400 and a message', async () => {
        await baseURLRequest()
          .post('/v3.3b/ed-fi/students')
          .auth(await getAccessToken('vendor'), { type: 'bearer' })
          .send({
            studentUniqueId: generateRandomId(),
            firstName: 'First',
            lastSurname: 'Last',
            birthDate: '2001-01-01',
            birthCountryDescriptor: 'uri://ed-fi.org/CountryDescriptor#AD3',
          })
          .expect(409)
          .then((response) => {
            expect(response.body).toMatchInlineSnapshot(
              `
              {
                "error": {
                  "failures": [
                    {
                      "identity": {
                        "descriptor": "uri://ed-fi.org/CountryDescriptor#AD3",
                      },
                      "resourceName": "CountryDescriptor",
                    },
                  ],
                  "message": "Reference validation failed",
                },
              }
            `,
            );
          });
      });
    });

    describe('given reference does exist', () => {
      let countryLocation: string;
      let countryDescriptor: string;
      let studentLocation: string;

      beforeAll(async () => {
        countryLocation = await createCountry();
        countryDescriptor = await getDescriptorByLocation(countryLocation);
      });

      it('should allow adding student', async () => {
        studentLocation = await createResource({
          endpoint: 'students',
          body: {
            studentUniqueId: generateRandomId(),
            firstName: 'First',
            lastSurname: 'Last',
            birthDate: '2001-01-01',
            birthCountryDescriptor: countryDescriptor,
          },
        });

        await rootURLRequest()
          .get(studentLocation)
          .auth(await getAccessToken('vendor'), { type: 'bearer' })
          .expect(200);
      });

      describe('when editing a student', () => {
        const studentUniqueId = generateRandomId();
        beforeAll(async () => {
          studentLocation = await createResource({
            endpoint: 'students',
            body: {
              studentUniqueId,
              firstName: 'First',
              lastSurname: 'Last',
              birthDate: '2001-01-01',
              birthCountryDescriptor: countryDescriptor,
            },
          });
        });

        it('should allow to edit', async () => {
          const id = await rootURLRequest()
            .get(studentLocation)
            .auth(await getAccessToken('vendor'), { type: 'bearer' })
            .then((response) => response.body.id);
          await rootURLRequest()
            .put(studentLocation)
            .auth(await getAccessToken('vendor'), { type: 'bearer' })
            .send({
              id,
              studentUniqueId,
              firstName: 'First',
              lastSurname: 'Last',
              birthDate: '2000-01-01',
              birthCountryDescriptor: countryDescriptor,
            })
            .expect(204);

          await baseURLRequest()
            .get('/v3.3b/ed-fi/students')
            .auth(await getAccessToken('vendor'), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ studentUniqueId })]));
            });

          await rootURLRequest()
            .get(studentLocation)
            .auth(await getAccessToken('vendor'), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.body).toEqual(expect.objectContaining({ birthDate: '2000-01-01' }));
            });
        });
      });

      afterEach(async () => {
        await deleteResourceByLocation(studentLocation, 'student');
      });

      afterAll(async () => {
        await deleteResourceByLocation(countryLocation, 'country');
      });
    });
  });

  describe('given a token with relaxed validation', () => {
    let studentLocation: string;

    it('should allow invalid country', async () => {
      studentLocation = await createResource({
        endpoint: 'students',
        role: 'host',
        body: {
          studentUniqueId: generateRandomId(),
          firstName: 'First',
          lastSurname: 'Last',
          birthDate: '2001-01-01',
          birthCountryDescriptor: 'uri://ed-fi.org/CountryDescriptor#AD3',
        },
      });

      await rootURLRequest()
        .get(studentLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(200);
    });

    afterAll(async () => {
      await deleteResourceByLocation(studentLocation, 'student');
    });
  });
});
