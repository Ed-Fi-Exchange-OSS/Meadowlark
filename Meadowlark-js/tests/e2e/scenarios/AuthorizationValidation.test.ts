// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { adminAccessToken, getAccessToken } from '../helpers/Credentials';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

const ENDPOINT = `/oauth/clients`;

describe("given it's managing the client authorization", () => {
  describe('given client already exists ', () => {
    let adminToken: string;
    let location: string;
    const clientData = {
      clientName: 'Test Vendor',
      roles: ['vendor'],
    };
    beforeAll(async () => {
      adminToken = await adminAccessToken();
      location = await baseURLRequest()
        .post(ENDPOINT)
        .send(clientData)
        .expect(201)
        .auth(adminToken, { type: 'bearer' })
        .then((response) => response.headers.location);
    });

    describe("given it's creating a client", () => {
      describe('when generating a client with invalid admin token', () => {
        it('should return error message', async () => {
          await baseURLRequest()
            .post(ENDPOINT)
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
            .post(ENDPOINT)
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
              .post(ENDPOINT)
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
              .post(ENDPOINT)
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
                .post(ENDPOINT)
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
                .post(ENDPOINT)
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
            .post(ENDPOINT)
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
            .post(ENDPOINT)
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

    describe('when retrieving information', () => {
      describe("given it's an administrator user", () => {
        it('should be able to retrieve the client', async () => {
          await rootURLRequest()
            .get(location)
            .auth(adminToken, { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.body).toEqual(
                expect.objectContaining({
                  clientName: clientData.clientName,
                  roles: clientData.roles,
                  active: true,
                }),
              );
            });
        });

        it('should be able to retrieve all clients', async () => {
          await baseURLRequest()
            .get(ENDPOINT)
            .auth(adminToken, { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.body).toMatchInlineSnapshot(
                'a',
                `
                [
                  {
                    "active": true,
                    "clientId": "15f4a6e8-386e-4e38-a9be-16c29803097f",
                    "clientName": "Admin Client",
                    "roles": [
                      "admin",
                    ],
                  },
                  {
                    "active": true,
                    "clientId": "8176b587-c645-46fd-906e-03abdaa09d67",
                    "clientName": "Automated Vendor",
                    "roles": [
                      "vendor",
                    ],
                  },
                  {
                    "active": true,
                    "clientId": "7379e28a-0ea2-4777-b3f6-5dfb71a533ba",
                    "clientName": "Automated Host",
                    "roles": [
                      "host",
                      "assessment",
                    ],
                  },
                  {
                    "active": true,
                    "clientId": "6088c190-23e6-4f22-bdb2-b56e355aef71",
                    "clientName": "Test Vendor",
                    "roles": [
                      "vendor",
                    ],
                  },
                  {
                    "active": true,
                    "clientId": "99a4e140-2e8e-46b2-9dcf-51f762dccd0f",
                    "clientName": "Test Client",
                    "roles": [
                      "verify-only",
                    ],
                  },
                  {
                    "active": true,
                    "clientId": "32ec9428-faa6-49cf-a63f-85736d8eb94a",
                    "clientName": "Test Client",
                    "roles": [
                      "admin",
                    ],
                  },
                  {
                    "active": true,
                    "clientId": "28341b69-e24b-436f-bfa9-d19a098f7811",
                    "clientName": "Test Client",
                    "roles": [
                      "admin",
                      "assessment",
                    ],
                  },
                  {
                    "active": true,
                    "clientId": "0bc5d890-ee33-4ebd-9ddd-62507e40d59f",
                    "clientName": "Test Client",
                    "roles": [
                      "assessment",
                      "host",
                    ],
                  },
                  {
                    "active": true,
                    "clientId": "15919ffe-24e4-4579-a50f-a5112b631413",
                    "clientName": "Test Client",
                    "roles": [
                      "assessment",
                      "vendor",
                    ],
                  },
                ]
              `,
              );
            });
        });
      });

      describe('given ID not found', () => {
        it('should return 404', async () => {
          await baseURLRequest().get(`${ENDPOINT}/fake-location`).auth(adminToken, { type: 'bearer' }).expect(404);
        });
      });

      describe("given it's not administrator user", () => {
        it('should return 403 status', async () => {
          await rootURLRequest()
            .get(location)
            .auth(await getAccessToken('vendor'), { type: 'bearer' })
            .expect(403);
        });
      });

      describe('when editing information', () => {
        describe('given information is updated', () => {
          let updatedClientData;
          beforeAll(() => {
            updatedClientData = {
              clientName: 'Updated Vendor',
              roles: clientData.roles,
            };
            updatedClientData.roles.push('assessment');
          });

          describe("given it's and administrator user", () => {
            it('should be able update', async () => {
              await rootURLRequest().put(location).auth(adminToken, { type: 'bearer' }).send(updatedClientData).expect(204);

              await rootURLRequest()
                .get(location)
                .auth(adminToken, { type: 'bearer' })
                .send(updatedClientData)
                .expect(200)
                .then((response) => {
                  expect(response.body).toEqual(expect.objectContaining(updatedClientData));
                });
            });
          });
        });
      });
    });
  });
});
