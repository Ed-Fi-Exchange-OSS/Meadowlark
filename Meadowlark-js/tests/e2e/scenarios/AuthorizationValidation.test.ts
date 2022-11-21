// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { adminAccessToken, getAccessToken } from '../helpers/Credentials';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe("given it's managing the client authorization", () => {
  describe("given it's creating a client", () => {
    describe('when generating a client with invalid admin token', () => {
      it('should return error message', async () => {
        await baseURLRequest()
          .post(`/oauth/client`)
          .auth('', { type: 'bearer' })
          .send({
            clientName: 'Automation Client',
            roles: ['vendor'],
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

    describe('when generating a client without admin token', () => {
      it('should return error message', async () => {
        await baseURLRequest()
          .post(`/oauth/client`)
          .send({
            clientName: 'Automation Client',
            roles: ['vendor'],
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

    describe('when generating a client with a role combination', () => {
      // This should be modified when RND-452 is done
      describe('when using a valid combination of roles', () => {
        it.each([
          { roles: ['verify-only'] },
          { roles: ['admin'] },
          { roles: ['admin', 'assessment'] },
          { roles: ['assessment', 'host'] },
          { roles: ['assessment', 'vendor'] },
        ])('should create client with %j', async (item) => {
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

      describe('when using an invalid combination of roles', () => {
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

  describe('when retrieving client information', () => {
    let adminToken: string;
    beforeAll(async () => {
      adminToken = await adminAccessToken();
    });

    describe("given it's an administrator user", () => {
      describe('given location exists', () => {
        let location: string;
        const clientData = {
          clientName: 'Test Vendor',
          roles: ['vendor'],
        };
        beforeAll(async () => {
          location = await baseURLRequest()
            .post(`/oauth/client`)
            .send(clientData)
            .auth(adminToken, { type: 'bearer' })
            .then((response) => response.headers.location);
        });

        it('should be able to retrieve the client', async () => {
          await rootURLRequest()
            .get(location)
            .auth(adminToken, { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.body.active).toBeTruthy();
              expect(response.body).toEqual(expect.objectContaining(clientData));
            });
        });
      });

      describe('given location not found', () => {
        const location = '/fake-location';

        it('should return 404', async () => {
          await rootURLRequest().get(location).auth(adminToken, { type: 'bearer' }).expect(404);
        });
      });
    });

    describe("given it's not administrator user", () => {
      let location: string;
      const clientData = {
        clientName: 'Test Vendor',
        roles: ['vendor'],
      };
      beforeAll(async () => {
        location = await baseURLRequest()
          .post(`/oauth/client`)
          .send(clientData)
          .auth(adminToken, { type: 'bearer' })
          .then((response) => response.headers.location);
      });

      it('should return 403 status', async () => {
        await rootURLRequest()
          .get(location)
          .auth(await getAccessToken('vendor'), { type: 'bearer' })
          .expect(403);
      });
    });
  });
});
