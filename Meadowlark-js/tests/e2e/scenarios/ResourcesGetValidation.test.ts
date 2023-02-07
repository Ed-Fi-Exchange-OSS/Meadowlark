// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createContentClassDescriptor } from '../helpers/DataCreation';
import { deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('given a GET of an existent EducationContent', () => {
  let contentClassDescriptorLocation = '';
  let educationContentLocation = '';
  const educationContentEndpoint = 'EducationContents';

  const educationContentBody = {
    contentIdentifier: '933zsd4350',
    namespace: '43210',
    shortDescription: 'abc',
    contentClassDescriptor: 'uri://ed-fi.org/ContentClassDescriptor#Presentation',
    learningResourceMetadataURI: '21430',
  };

  beforeAll(async () => {
    contentClassDescriptorLocation = await createContentClassDescriptor();

    await baseURLRequest()
      .post(`/v3.3b/ed-fi/${educationContentEndpoint}`)
      .send(educationContentBody)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(201)
      .then((response) => {
        expect(response).not.toBe('');
        educationContentLocation = response.headers.location;
      });
  });

  it('should return the EducationContent', async () => {
    await rootURLRequest()
      .get(educationContentLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(expect.objectContaining(educationContentBody));
      });
  });

  afterAll(async () => {
    await deleteResourceByLocation(educationContentLocation);
    await deleteResourceByLocation(contentClassDescriptorLocation);
  });
});

describe('given a GET of a non-existent EducationContent', () => {
  it('should return not found', async () => {
    await rootURLRequest()
      .get(`/v3.3b/ed-fi/someunexistingresource`)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(404);
  });
});
