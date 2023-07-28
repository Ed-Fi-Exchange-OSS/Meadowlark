// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { adminAccessToken, getAccessToken } from '../helpers/Credentials';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { rootURLRequest } from '../helpers/Shared';

describe("given it's handling the client permission", () => {
  const countryDescriptor = {
    codeValue: 'US',
    shortDescription: 'US',
    description: 'US',
    namespace: 'uri://ed-fi.org/CountryDescriptor',
  };
  let vendorToken: string;
  let hostToken: string;
  let adminToken: string;
  let countryLocation: string;
  beforeAll(async () => {
    vendorToken = await getAccessToken('vendor');
    hostToken = await getAccessToken('host');
    adminToken = await adminAccessToken();
  });

  afterAll(async () => {
    await deleteResourceByLocation(countryLocation, 'country');
  });

  describe('when resource is created by host', () => {
    beforeAll(async () => {
      countryLocation = await createResource({
        endpoint: 'countryDescriptors',
        role: 'host',
        body: countryDescriptor,
      });
    });

    it('returns 200 when querying by host', async () => {
      await rootURLRequest()
        .get(countryLocation)
        .auth(hostToken, { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(countryDescriptor));
        });
    });

    it('returns 200 when querying by vendor', async () => {
      await rootURLRequest()
        .get(countryLocation)
        .auth(vendorToken, { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(countryDescriptor));
        });
    });

    it('returns 403 when updating by vendor', async () => {
      const id = await rootURLRequest()
        .get(countryLocation)
        .auth(vendorToken, { type: 'bearer' })
        .then((response) => response.body.id);
      await rootURLRequest()
        .put(countryLocation)
        .auth(vendorToken, { type: 'bearer' })
        .send({
          id,
          codeValue: 'US',
          shortDescription: 'US',
          description: 'USA',
          namespace: 'uri://ed-fi.org/CountryDescriptor',
        })
        .expect(403);
    });

    afterAll(async () => {
      await deleteResourceByLocation(countryLocation, 'country');
    });
  });

  describe('when resource is created by admin', () => {
    beforeAll(async () => {
      countryLocation = await createResource({
        endpoint: 'countryDescriptors',
        role: 'admin',
        body: countryDescriptor,
      });
    });

    it('returns 200 when querying by admin', async () => {
      await rootURLRequest()
        .get(countryLocation)
        .auth(adminToken, { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(countryDescriptor));
        });
    });

    it('returns 200 when querying by host', async () => {
      await rootURLRequest()
        .get(countryLocation)
        .auth(hostToken, { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(countryDescriptor));
        });
    });
  });
});
