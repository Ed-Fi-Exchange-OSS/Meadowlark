// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {baseURLRequest, generateRandomId, getAccessToken, rootURLRequest} from "./SharedFunctions";

describe('Students', () => {

  describe('with strict validation', () => {
    it('should fail with invalid country descriptor', async () => {
      await baseURLRequest
        .post('/v3.3b/ed-fi/students')
        .auth(await getAccessToken(), {type: 'bearer'})
        .send({
          "studentUniqueId": generateRandomId(),
          "firstName": "First",
          "lastSurname": "Last",
          "birthDate": "2001-01-01",
          "birthCountryDescriptor": "uri://ed-fi.org/CountryDescriptor#AD3"
        })
        .expect(400)
        .then(response => {
          expect(response.body.message).toContain('Resource CountryDescriptor is missing identity')
        });
    });
  });

  describe('without strict validation', () => {
    let studentLocation: string;

    it('should allow invalid country', async () => {
      let client = "client4";
      studentLocation = await baseURLRequest
        .post('/v3.3b/ed-fi/students')
        .auth(await getAccessToken(client), {type: 'bearer'})
        .send({
          "studentUniqueId": generateRandomId(),
          "firstName": "First",
          "lastSurname": "Last",
          "birthDate": "2001-01-01",
          "birthCountryDescriptor": "uri://ed-fi.org/CountryDescriptor#AD3"
        })
        .expect(201)
        .then(response => {
          expect(response.headers[ 'location' ]).not.toBe(null);
          return response.headers[ 'location' ];
        });

      await rootURLRequest
        .get(studentLocation)
        .auth(await getAccessToken(client), {type: 'bearer'})
        .expect(200);
    });

    afterAll(async () => {
      if (studentLocation) {
        await rootURLRequest
          .delete(studentLocation)
          .auth(await getAccessToken("client4"), {type: 'bearer'})
          .expect(204);
      }
    });
  });

  //TBD: Create test for student created with one credential accessed by another

});
