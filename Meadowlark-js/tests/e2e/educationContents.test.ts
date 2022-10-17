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

describe('Education contents', () => {
  let educationContentLocation: string;
  let contentClassDescriptorLocation: string;
  let contentClassDescriptor: string;

  beforeAll(async () => {
    contentClassDescriptorLocation = await createContentClassDescriptor();
    contentClassDescriptor = await getDescriptorByLocation(contentClassDescriptorLocation);
  });

  describe('Create', () => {
    it('should create an education content', async () => {
      const contentIdentifier = generateRandomId();
      // Decide: Move to a common class to reuse?
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
          expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ contentIdentifier })]));
        });

      await rootURLRequest
        .get(educationContentLocation)
        .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
        .expect(200);
    });
  });

  describe('Edit', () => {
    const contentIdentifier = generateRandomId();
    beforeAll(async () => {
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
    });

    it('should edit an education content', async () => {
      const uri = 'uri://ed-fi.org/fake-updated-uri';
      await rootURLRequest
        .put(educationContentLocation)
        .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
        .send({
          contentIdentifier,
          namespace: '43210',
          shortDescription: 'ShortDesc',
          contentClassDescriptor,
          learningResourceMetadataURI: uri,
        })
        .expect(204);

      await rootURLRequest
        .get(educationContentLocation)
        .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining({ learningResourceMetadataURI: uri }));
        });
    });
  });

  afterEach(async () => {
    await deleteByLocation(educationContentLocation);
  });

  afterAll(async () => {
    await deleteByLocation(contentClassDescriptorLocation);
  });
});
