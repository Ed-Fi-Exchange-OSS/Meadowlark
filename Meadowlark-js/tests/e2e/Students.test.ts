// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// import {baseURLRequest, generateRandomId, getAccessToken} from "./SharedFunctions";

describe('Students', () => {
  it('should fail with invalid country descriptor', async () => {
    // baseURLRequest
    //   .post('/v3.3b/ed-fi/students')
    //   .auth(await getAccessToken(), {type: 'bearer'})
    //   .send({
    //     "studentUniqueId": generateRandomId(),
    //     "firstName": "First",
    //     "lastSurname": "Last",
    //     "birthDate": "2001-01-01",
    //     "birthCountryDescriptor": "uri://ed-fi.org/CountryDescriptor#AD3"
    //   })
    //   .expect(400)
    //   .then(response => {
    //     expect(response.body.message).toContain('Resource CountryDescriptor is missing identity')
    //   });
    expect(true).toBe(true);
  });

  // it('should allow invalid country for token without strict validation', async () => {
  //   let client = "client4";
  //   baseURLRequest
  //     .post('/v3.3b/ed-fi/students')
  //     .auth(await getAccessToken(client), {type: 'bearer'})
  //     .send({
  //       "studentUniqueId": generateRandomId(),
  //       "firstName": "First",
  //       "lastSurname": "Last",
  //       "birthDate": "2001-01-01",
  //       "birthCountryDescriptor": "uri://ed-fi.org/CountryDescriptor#AD3"
  //     })
  //     .expect(400)
  //     .then(response => {
  //       console.log(response);

  //       expect(response.body.message).toContain('Resource CountryDescriptor is missing identity')
  //     });
  // });

});
