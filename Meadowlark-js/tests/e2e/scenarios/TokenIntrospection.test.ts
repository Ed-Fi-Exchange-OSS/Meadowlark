// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { adminAccessToken, getAccessToken } from '../helpers/Credentials';
import { baseURLRequest } from '../helpers/Shared';

describe('when reviewing access token', () => {
  let vendorToken: string;
  let hostToken: string;
  let adminToken: string;
  beforeAll(async () => {
    vendorToken = await getAccessToken('vendor');
    hostToken = await getAccessToken('host');
    adminToken = await adminAccessToken();
  });

  describe('given content type not specified', () => {
    it('should return error message', async () => {
      await baseURLRequest()
        .post(`/oauth/verify`)
        .auth(hostToken, { type: 'bearer' })
        .send({
          token: adminToken,
        })
        .expect(400)
        .then((response) => {
          expect(response.body.error).toMatchInlineSnapshot(`"Requires application/x-www-form-urlencoded content type"`);
        });
    });
  });

  describe('given a host access token', () => {
    describe('when reviewing own access token', () => {
      it('should be able to see information', async () => {
        await baseURLRequest()
          .post(`/oauth/verify`)
          .auth(hostToken, { type: 'bearer' })
          .send(`token=${hostToken}`)
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(
              expect.objectContaining({
                active: true,
                aud: 'ed-fi-meadowlark',
                roles: ['host', 'assessment'],
                sub: 'Automated Host',
              }),
            );
          });
      });
    });

    describe('when reviewing admin access token', () => {
      it('should return 401', async () => {
        await baseURLRequest()
          .post(`/oauth/verify`)
          .auth(hostToken, { type: 'bearer' })
          .send(`token=${adminToken}`)
          .expect(401);
      });
    });

    describe('when reviewing vendor access token', () => {
      it('should return 401', async () => {
        await baseURLRequest()
          .post(`/oauth/verify`)
          .auth(hostToken, { type: 'bearer' })
          .send(`token=${vendorToken}`)
          .expect(401);
      });
    });
  });

  describe('given a vendor access token', () => {
    describe('when reviewing own access token', () => {
      it('should be able to see information', async () => {
        await baseURLRequest()
          .post(`/oauth/verify`)
          .auth(vendorToken, { type: 'bearer' })
          .send(`token=${vendorToken}`)
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(
              expect.objectContaining({
                active: true,
                aud: 'ed-fi-meadowlark',
                roles: ['vendor'],
                sub: 'Automated Vendor',
              }),
            );
          });
      });
    });

    describe('when reviewing host access token', () => {
      it('should return 401', async () => {
        await baseURLRequest()
          .post(`/oauth/verify`)
          .auth(vendorToken, { type: 'bearer' })
          .send(`token=${hostToken}`)
          .expect(401);
      });
    });

    describe('when reviewing admin access token', () => {
      it('should return 401', async () => {
        await baseURLRequest()
          .post(`/oauth/verify`)
          .auth(vendorToken, { type: 'bearer' })
          .send(`token=${adminToken}`)
          .expect(401);
      });
    });
  });

  describe('given an admin reviewing host access token', () => {
    describe('when reviewing own access token', () => {
      it('should be able to retrieve information', async () => {
        await baseURLRequest()
          .post(`/oauth/verify`)
          .auth(adminToken, { type: 'bearer' })
          .send(`token=${adminToken}`)
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(
              expect.objectContaining({
                active: true,
                aud: 'ed-fi-meadowlark',
                roles: ['admin'],
                sub: expect.any(String),
              }),
            );
          });
      });
    });

    describe('when reviewing host access token', () => {
      it('should be able to see information', async () => {
        await baseURLRequest()
          .post(`/oauth/verify`)
          .auth(adminToken, { type: 'bearer' })
          .send(`token=${hostToken}`)
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(
              expect.objectContaining({
                active: true,
                aud: 'ed-fi-meadowlark',
                roles: ['host', 'assessment'],
                sub: 'Automated Host',
              }),
            );
          });
      });
    });

    describe('when reviewing vendor access token', () => {
      it('should be able to retrieve information', async () => {
        await baseURLRequest()
          .post(`/oauth/verify`)
          .auth(adminToken, { type: 'bearer' })
          .send(`token=${vendorToken}`)
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(
              expect.objectContaining({
                active: true,
                aud: 'ed-fi-meadowlark',
                roles: ['vendor'],
                sub: 'Automated Vendor',
              }),
            );
          });
      });
    });
  });
});
