// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createContentClassDescriptor } from '../helpers/DataCreation';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { getDescriptorByLocation, generateRandomId, baseURLRequest, rootURLRequest } from '../helpers/Shared';

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
      educationContentLocation = await createResource({
        endpoint: 'educationContents',
        body: {
          contentIdentifier,
          namespace: '43210',
          shortDescription: 'ShortDesc',
          contentClassDescriptor,
          learningResourceMetadataURI: 'uri://ed-fi.org/fake-uri',
        },
      });

      await baseURLRequest()
        .get('/v3.3b/ed-fi/educationContents')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ contentIdentifier })]));
        });

      await rootURLRequest()
        .get(educationContentLocation)
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .expect(200);
    });
  });

  describe('Edit', () => {
    const contentIdentifier = generateRandomId();
    beforeAll(async () => {
      educationContentLocation = await createResource({
        endpoint: 'educationContents',
        body: {
          contentIdentifier,
          namespace: '43210',
          shortDescription: 'ShortDesc',
          contentClassDescriptor,
          learningResourceMetadataURI: 'uri://ed-fi.org/fake-uri',
        },
      });
    });

    it('should edit an education content', async () => {
      const uri = 'uri://ed-fi.org/fake-updated-uri';
      await rootURLRequest()
        .put(educationContentLocation)
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .send({
          contentIdentifier,
          namespace: '43210',
          shortDescription: 'ShortDesc',
          contentClassDescriptor,
          learningResourceMetadataURI: uri,
        })
        .expect(204);

      await rootURLRequest()
        .get(educationContentLocation)
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining({ learningResourceMetadataURI: uri }));
        });
    });
  });

  afterEach(async () => {
    await deleteResourceByLocation(educationContentLocation, 'educationContent');
  });

  afterAll(async () => {
    await deleteResourceByLocation(contentClassDescriptorLocation, 'contentClass');
  });
});
