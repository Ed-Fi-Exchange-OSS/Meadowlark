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
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": "[{"message":"'grant_type' property must be equal to one of the allowed values","path":"{requestBody}.grant_type","context":{"errorType":"enum","allowedValues":["client_credentials"]}}]",
            }
          `);
        });
    });
  });
});
