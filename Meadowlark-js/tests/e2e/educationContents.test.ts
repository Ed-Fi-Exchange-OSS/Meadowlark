// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  baseURLRequest,
  rootURLRequest,
  generateRandomId,
  getAccessToken,
  deleteByLocation,
  createContentClassDescriptor,
  getDescriptorByLocation,
  Clients,
} from './SharedFunctions';

describe('Create education content', () => {
  let educationContentLocation: string;
  let contentClassDescriptorLocation: string;
  let contentClassDescriptor: string;

  beforeEach(async () => {
    contentClassDescriptorLocation = await createContentClassDescriptor();
    contentClassDescriptor = await getDescriptorByLocation(contentClassDescriptorLocation);
  });

  it('should create an education content', async () => {
    const contentIdentifier = generateRandomId();
    educationContentLocation = await baseURLRequest
      .post('/v3.3b/ed-fi/educationContents')
      .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
      .send({
        contentIdentifier,
        namespace: '43210',
        shortDescription: 'ShortDesc',
        contentClassDescriptor,
        learningResourceMetadataURI: 'uri://ed-fi.org/fake-uri',
      })
      .expect(201)
      .then((response) => {
        expect(response.headers.location).not.toBe(null);
        return response.headers.location;
      });

    await baseURLRequest
      .get('/v3.3b/ed-fi/educationContents')
      .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
      .expect(200)
      .then((response) => {
        const edContents = response.body;
        expect(edContents).toEqual(expect.arrayContaining([expect.objectContaining({ contentIdentifier })]));
      });

    await rootURLRequest
      .get(educationContentLocation)
      .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
      .expect(200);
  });

  afterAll(async () => {
    if (educationContentLocation) {
      await deleteByLocation(educationContentLocation);
    }

    if (contentClassDescriptorLocation) {
      await deleteByLocation(contentClassDescriptorLocation);
    }
  });
});
