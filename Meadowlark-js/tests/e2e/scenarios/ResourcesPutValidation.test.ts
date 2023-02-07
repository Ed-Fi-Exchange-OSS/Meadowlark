// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createContentClassDescriptor } from '../helpers/DataCreation';
import { deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('given a POST of an EducationContent followed by a second POST of the EducationContent with a changed field', () => {
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

  const educationContentBodyUpdated = {
    contentIdentifier: '933zsd4350',
    namespace: '43210',
    shortDescription: 'abc+',
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

  it('should return upsert success', async () => {
    await rootURLRequest()
      .put(educationContentLocation)
      .send(educationContentBodyUpdated)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(204);
  });

  it('should return updated EducationContent', async () => {
    await rootURLRequest()
      .get(educationContentLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(expect.objectContaining(educationContentBodyUpdated));
      });
  });

  afterAll(async () => {
    await deleteResourceByLocation(educationContentLocation);
    await deleteResourceByLocation(contentClassDescriptorLocation);
  });
});

describe('given a PUT of the EducationContent with empty body', () => {
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

  it('should return put failure with errors', async () => {
    await rootURLRequest()
      .put(educationContentLocation)
      .send({})
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .expect(400)
      .then((response) => {
        expect(response.body).toMatchInlineSnapshot(`
        {
          "error": [
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'contentIdentifier'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'learningResourceMetadataURI'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'shortDescription'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'contentClassDescriptor'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'namespace'",
              "path": "{requestBody}",
            },
          ],
        }
        `);
      });
  });

  it('should return EducationContent', async () => {
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

describe('given a POST of a EducationContent followed by the PUT of the school with a different identity', () => {
  let contentClassDescriptorLocation = '';
  let educationContentLocation = '';
  const educationContentEndpoint = 'EducationContents';
  const contentIdentifier = '933zsd4350';

  const educationContentBody = {
    contentIdentifier,
    namespace: '43210',
    shortDescription: 'abc',
    contentClassDescriptor: 'uri://ed-fi.org/ContentClassDescriptor#Presentation',
    learningResourceMetadataURI: '21430',
  };

  const educationContentBodyUpdated = {
    contentIdentifier: `${contentIdentifier}+`,
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

  it('should return put failure', async () => {
    await rootURLRequest()
      .put(educationContentLocation)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .send(educationContentBodyUpdated)
      .expect(400)
      .then((response) => {
        expect(response.body).toMatchInlineSnapshot(`
        {
          "error": "The identity of the resource does not match the identity in the updated document.",
        }
        `);
      });
  });

  afterAll(async () => {
    await deleteResourceByLocation(educationContentLocation);
    await deleteResourceByLocation(contentClassDescriptorLocation);
  });
});
