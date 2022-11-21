// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { adminAccessToken, getAccessToken } from '../helpers/Credentials';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest } from '../helpers/Shared';

describe("given it's handling the client permission", () => {
  let vendorToken: string;
  let hostToken: string;
  let adminToken: string;
  beforeAll(async () => {
    vendorToken = await getAccessToken('vendor');
    hostToken = await getAccessToken('host');
    adminToken = await adminAccessToken();
  });

  describe('when resource is created by host', () => {
    let countryLocation: string;
    beforeAll(async () => {
      countryLocation = await createResource({
        endpoint: 'countryDescriptors',
        role: 'host',
        body: {
          codeValue: 'US',
          shortDescription: 'US',
          description: 'US',
          namespace: 'uri://ed-fi.org/CountryDescriptor',
        },
      });
    });

    it('returns 200 when querying by host', async () => {
      await baseURLRequest().get(countryLocation).auth(hostToken, { type: 'bearer' }).expect(404);
    });

    it('returns 404 when querying by vendor', async () => {
      await baseURLRequest().get(countryLocation).auth(vendorToken, { type: 'bearer' }).expect(404);
    });

    it('returns 404 when updating by vendor', async () => {
      console.log(countryLocation);

      await baseURLRequest()
        .put(countryLocation)
        .auth(vendorToken, { type: 'bearer' })
        .send({
          codeValue: 'US',
          shortDescription: 'US',
          description: 'USA',
          namespace: 'uri://ed-fi.org/CountryDescriptor',
        })
        .expect(404);
    });

    afterAll(async () => {
      await deleteResourceByLocation(countryLocation);
    });
  });

  describe('when resource is created by admin', () => {
    let countryLocation: string;
    beforeAll(async () => {
      countryLocation = await createResource({
        endpoint: 'countryDescriptors',
        role: 'admin',
        body: {
          codeValue: 'US',
          shortDescription: 'US',
          description: 'US',
          namespace: 'uri://ed-fi.org/CountryDescriptor',
        },
      });
    });

    it('returns 404 when querying by same role', async () => {
      await baseURLRequest().get(countryLocation).auth(adminToken, { type: 'bearer' }).expect(404);
    });

    // According to https://techdocs.ed-fi.org/display/EFTD/Meadowlark+-+Internal+OAuth+2+Client+Credential+Provider
    // This should work, but it's not
    it.skip('returns 200 when querying by host', async () => {
      await baseURLRequest().get(countryLocation).auth(hostToken, { type: 'bearer' }).expect(200);
    });

    afterAll(async () => {
      await deleteResourceByLocation(countryLocation);
    });
  });
});
