// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Credentials, getClientCredentials } from '../helpers/Credentials';
import { baseURLRequest } from '../helpers/Shared';

describe("Given it's authenticating an user", () => {
  let client: Credentials;
  beforeAll(async () => {
    client = await getClientCredentials('host');
  });

  describe('when providing invalid grant type', () => {
    it('should return error message', async () => {
      await baseURLRequest()
        .post('/oauth/token')
        .send({
          grant_type: 'wrong',
          client_id: client.key,
          client_secret: client.secret,
        })
        .expect(400)
        .then((response) => {
          expect(response).toMatchInlineSnapshot(`
            {
              "header": {
                "connection": "close",
                "content-length": "214",
                "content-type": "application/json",
                "date": "Fri, 18 Nov 2022 17:52:51 GMT",
                "x-ratelimit-limit": "1000",
                "x-ratelimit-remaining": "981",
                "x-ratelimit-reset": "56",
              },
              "req": {
                "data": {
                  "client_id": "31486b87-35cf-43bd-9245-e65f1b3343dc",
                  "client_secret": "32b7616f244ec44bbaa7023260823b1df9a4c5c5207516df4dbd35f48615c817",
                  "grant_type": "wrong",
                },
                "headers": {
                  "content-type": "application/json",
                },
                "method": "POST",
                "url": "http://localhost:3000/local/oauth/token",
              },
              "status": 400,
              "text": "{"error":"[{\\"message\\":\\"'grant_type' property must be equal to one of the allowed values\\",\\"path\\":\\"{requestBody}.grant_type\\",\\"context\\":{\\"errorType\\":\\"enum\\",\\"allowedValues\\":[\\"client_credentials\\"]}}]"}",
            }
          `);
        });
    });
  });
});
