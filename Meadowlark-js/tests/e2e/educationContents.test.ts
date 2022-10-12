// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { baseURLRequest, rootURLRequest, generateRandomId, getAccessToken } from './SharedFunctions';

describe('Create education content', () => {
  let educationContentLocation: string;
  let contentClassDescriptor: string;

  beforeEach(async () => {
    const contentClassDescriptorLocation = await baseURLRequest
      .post(`/v3.3b/ed-fi/contentClassDescriptors`)
      .auth(await getAccessToken(), { type: 'bearer' })
      .send({
        codeValue: 'Presentation',
        shortDescription: 'Presentation',
        description: 'Presentation',
        namespace: 'uri://ed-fi.org/ContentClassDescriptor',
      })
      .expect(200)
      .then((response) => {
        expect(response.headers.location).not.toBe(null);
        return response.headers.location;
      });

    contentClassDescriptor = await rootURLRequest
      .get(contentClassDescriptorLocation)
      .auth(await getAccessToken(), { type: 'bearer' })
      .expect(200)
      .then((response) => {
        expect(response.body).not.toBe(null);
        return `${response.body.namespace}#${response.body.description}`;
      });
  });

  it('should create an education content', async () => {
    educationContentLocation = await baseURLRequest
      .post('/v3.3b/ed-fi/educationContents')
      .auth(await getAccessToken(), { type: 'bearer' })
      .send({
        contentIdentifier: generateRandomId(),
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

    await rootURLRequest
      .get(educationContentLocation)
      .auth(await getAccessToken(), { type: 'bearer' })
      .expect(200);
  });

  afterAll(async () => {
    if (educationContentLocation) {
      await rootURLRequest
        .delete(educationContentLocation)
        .auth(await getAccessToken(), { type: 'bearer' })
        .expect(204);
    }
  });
});
