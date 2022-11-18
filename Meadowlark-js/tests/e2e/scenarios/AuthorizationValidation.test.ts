// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { adminAccessToken } from '../helpers/Credentials';
import { baseURLRequest } from '../helpers/Shared';

describe("Given it's creating a client", () => {
  describe('when generating an admin client', () => {
    describe('given client already exists', () => {
      it('should fail with 401 error', async () => {
        await baseURLRequest()
          .post(`/oauth/client`)
          .send({
            clientName: 'Admin Client',
            roles: ['admin'],
          })
          .expect(401)
          .then((response) => {
            expect(response.body).toMatchInlineSnapshot(`
              {
                "error": "invalid_client",
                "error_description": "Authorization token not provided",
              }
            `);
          });
      });
    });
  });

  describe('when generating a client with role combination', () => {
    // This should be modified when RND-452 is done
    describe('when generating a client with an valid combination of roles', () => {
      it.each([
        { roles: ['verify-only'] },
        { roles: ['admin'] },
        { roles: ['admin', 'assessment'] },
        { roles: ['assessment', 'host'] },
        { roles: ['assessment', 'vendor'] },
      ])('create client with %j', async (item) => {
        const { roles } = item;

        const clientInfo = {
          clientName: 'Test Client',
          roles,
        };

        await baseURLRequest()
          .post(`/oauth/client`)
          .auth(await adminAccessToken(), { type: 'bearer' })
          .send(clientInfo)
          .expect(201)
          .then((response) => {
            expect(response.body).toEqual(expect.objectContaining(clientInfo));
          });
      });
    });

    describe('when generating a client with an invalid combination of roles', () => {
      it.each([
        { roles: ['vendor', 'vendor'] },
        { roles: ['vendor', 'host'] },
        { roles: ['admin', 'host'] },
        { roles: ['admin', 'vendor'] },
        { roles: ['verify-only', 'host'] },
      ])('create client with %j', async (item) => {
        const { roles } = item;

        await baseURLRequest()
          .post(`/oauth/client`)
          .auth(await adminAccessToken(), { type: 'bearer' })
          .send({
            clientName: 'Admin Client',
            roles,
          })
          .expect(400)
          .then((response) => {
            expect(response.body).toMatchInlineSnapshot(`
              [
                {
                  "context": {
                    "errorType": "contains",
                  },
                  "message": "property 'roles' must contain at least 1 and no more than 1 valid item(s)",
                  "path": "{requestBody}.roles",
                },
              ]
            `);
          });
      });

      describe('when generating a client with more than 2 roles', () => {
        it('should return error message', async () => {
          const roles = ['admin', 'vendor', 'host'];

          await baseURLRequest()
            .post(`/oauth/client`)
            .auth(await adminAccessToken(), { type: 'bearer' })
            .send({
              clientName: 'Admin Client',
              roles,
            })
            .expect(400)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(`
                [
                  {
                    "context": {
                      "errorType": "maxItems",
                    },
                    "message": "property 'roles' must not have more than 2 items",
                    "path": "{requestBody}.roles",
                  },
                ]
              `);
            });
        });
      });

      describe('when generating a client with an invalid role', () => {
        it('should return error message', async () => {
          const roles = ['not-valid'];

          await baseURLRequest()
            .post(`/oauth/client`)
            .auth(await adminAccessToken(), { type: 'bearer' })
            .send({
              clientName: 'Admin Client',
              roles,
            })
            .expect(400)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(`
                [
                  {
                    "context": {
                      "allowedValues": [
                        "vendor",
                        "host",
                        "admin",
                        "assessment",
                        "verify-only",
                      ],
                      "errorType": "enum",
                    },
                    "message": "'0' property must be equal to one of the allowed values",
                    "path": "{requestBody}.roles.0",
                    "suggestion": "Did you mean 'host'?",
                  },
                  {
                    "context": {
                      "errorType": "contains",
                    },
                    "message": "property 'roles' must contain at least 1 and no more than 1 valid item(s)",
                    "path": "{requestBody}.roles",
                  },
                ]
              `);
            });
        });
      });
    });
  });

  describe('when missing client name', () => {
    it('should return error message', async () => {
      await baseURLRequest()
        .post(`/oauth/client`)
        .auth(await adminAccessToken(), { type: 'bearer' })
        .send({
          roles: ['vendor'],
        })
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            [
              {
                "context": {
                  "errorType": "required",
                },
                "message": "{requestBody} must have required property 'clientName'",
                "path": "{requestBody}",
              },
            ]
          `);
        });
    });
  });

  describe('when adding invalid client name', () => {
    it('should return error message', async () => {
      await baseURLRequest()
        .post(`/oauth/client`)
        .auth(await adminAccessToken(), { type: 'bearer' })
        .send({
          clientName: 1,
          roles: ['vendor'],
        })
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            [
              {
                "context": {
                  "errorType": "type",
                },
                "message": "'clientName' property type must be string",
                "path": "{requestBody}.clientName",
              },
            ]
          `);
        });
    });
  });
});
