// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, newFrontendRequest } from '../../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../../src/handler/FrontendResponse';
import { openApiUrlList } from '../../../src/handler/MetadataHandler';

describe('when getting the Open API metadata list', () => {
  describe('given stage is local', () => {
    let response: FrontendResponse;
    const event: FrontendRequest = {
      ...newFrontendRequest(),
      headers: {
        host: 'l:1',
      },
      path: '/local/metadata/',
      stage: 'local',
    };

    // In this expected output, note that `http` is used instead of `https`
    const EXPECTED_OUTPUT = `[
  {
    "name": "Descriptors",
    "endpointUri": "http://l:1/local/metadata/descriptors/swagger.json",
    "prefix": ""
  },
  {
    "name": "Resources",
    "endpointUri": "http://l:1/local/metadata/resources/swagger.json",
    "prefix": ""
  }
]`;

    // eslint-disable-next-line no-return-assign
    beforeAll(async () => {
      response = await openApiUrlList(event);
    });

    it('returns status 200', () => {
      expect(response.statusCode).toEqual(200);
    });
    it('returns the expected JSON output', () => {
      expect(response.body).toEqual(EXPECTED_OUTPUT);
    });
  });

  describe('given stage is NOT local', () => {
    let response: FrontendResponse;
    const event: FrontendRequest = {
      ...newFrontendRequest(),
      headers: {
        host: 'l:1',
      },
      path: '/!@#/metadata/',
      stage: '!@#',
    };

    // In this expected output, note that `https` is used instead of `http`
    const EXPECTED_OUTPUT = `[
  {
    "name": "Descriptors",
    "endpointUri": "https://l:1/!@#/metadata/descriptors/swagger.json",
    "prefix": ""
  },
  {
    "name": "Resources",
    "endpointUri": "https://l:1/!@#/metadata/resources/swagger.json",
    "prefix": ""
  }
]`;

    // eslint-disable-next-line no-return-assign
    beforeAll(async () => {
      response = await openApiUrlList(event);
    });

    it('returns status 200', () => {
      expect(response.statusCode).toEqual(200);
    });
    it('returns the expected JSON output', () => {
      expect(response.body).toEqual(EXPECTED_OUTPUT);
    });
  });
});
