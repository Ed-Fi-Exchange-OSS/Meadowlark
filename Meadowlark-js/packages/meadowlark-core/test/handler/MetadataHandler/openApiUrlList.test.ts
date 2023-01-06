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

    // eslint-disable-next-line no-return-assign
    beforeAll(async () => {
      response = await openApiUrlList(event);
    });

    it('returns status 200', () => {
      expect(response.statusCode).toEqual(200);
    });

    it('returns the expected JSON output', () => {
      // In this expected output, note that `http` is used instead of `https`
      expect(response.body).toMatchInlineSnapshot(`
        [
          {
            "endpointUri": "http://l:1/local/metadata/descriptors/swagger.json",
            "name": "Descriptors",
            "prefix": "",
          },
          {
            "endpointUri": "http://l:1/local/metadata/resources/swagger.json",
            "name": "Resources",
            "prefix": "",
          },
        ]
      `);
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

    // eslint-disable-next-line no-return-assign
    beforeAll(async () => {
      response = await openApiUrlList(event);
    });

    it('returns status 200', () => {
      expect(response.statusCode).toEqual(200);
    });
    it('returns the expected JSON output', () => {
      // In this expected output, note that `https` is used instead of `http`
      expect(response.body).toMatchInlineSnapshot(`
        [
          {
            "endpointUri": "https://l:1/!@#/metadata/descriptors/swagger.json",
            "name": "Descriptors",
            "prefix": "",
          },
          {
            "endpointUri": "https://l:1/!@#/metadata/resources/swagger.json",
            "name": "Resources",
            "prefix": "",
          },
        ]
      `);
    });
  });
});
