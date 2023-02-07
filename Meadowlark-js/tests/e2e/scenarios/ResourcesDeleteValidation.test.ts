// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createContentClassDescriptor } from '../helpers/DataCreation';
import { deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('given a DELETE of a non-existent EducationContent', () => {
  const educationContentEndpoint = 'EducationContents';
  const educationContentId = 'some_not_existing_EducationContent_id';

  it('should return not found from delete', async () => {
    await baseURLRequest()
      .delete(`/v3.3b/ed-fi/${educationContentEndpoint}/${educationContentId}`)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(404);
  });
});

describe('given a DELETE of an EducationContent', () => {
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

  it('should return delete success', async () => {
    await rootURLRequest()
      .delete(educationContentLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .then((response) => {
        expect(response.status).toEqual(204);
      });
  });

  it('should return not found from get', async () => {
    await rootURLRequest()
      .get(educationContentLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(404);
  });

  afterAll(async () => {
    await deleteResourceByLocation(contentClassDescriptorLocation);
  });
});
