// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Credentials, getClientCredentials } from '../helpers/Credentials';
import { baseURLRequest } from '../helpers/Shared';

describe("given it's authenticating a client", () => {
  let client: Credentials;
  beforeAll(async () => {
    client = await getClientCredentials('host');
  });

  describe('when providing valid admin information', () => {
    it('should be able to return access token', async () => {
      await baseURLRequest()
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: client.key,
          client_secret: client.secret,
        })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              access_token: expect.any(String),
              expires_in: expect.any(Number),
              refresh_token: 'not available',
              token_type: 'bearer',
            }),
          );
        });
    });
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

  describe('when providing invalid key', () => {
    it('should return 404', async () => {
      await baseURLRequest()
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'key',
          client_secret: client.secret,
        })
        .expect(404);
    });
  });

  describe('when providing invalid secret', () => {
    it('should return 401', async () => {
      await baseURLRequest()
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: client.key,
          client_secret: 'secret',
        })
        .expect(401)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`""`);
        });
    });
  });
});
