// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, newFrontendRequest } from '../../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../../src/handler/FrontendResponse';
import { apiVersion } from '../../../src/handler/MetadataHandler';
import { setupMockConfiguration } from '../../ConfigHelper';

describe('when getting API version information', () => {
  describe('given a valid request not running in localhost', () => {
    let response: FrontendResponse;

    beforeAll(async () => {
      setupMockConfiguration();

      const event: FrontendRequest = {
        ...newFrontendRequest(),
        headers: {
          host: 'test_url',
        },

        stage: 'outside',
      };

      // Act
      response = await apiVersion(event);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('returns status 200', () => {
      expect(response.statusCode).toEqual(200);
    });
    it('returns the expected JSON output with https', () => {
      expect(response.body).toMatchInlineSnapshot(`
        {
          "apiMode": "SharedInstance",
          "dataModels": [
            {
              "name": "Ed-Fi",
              "version": "3.3.1-b",
            },
          ],
          "urls": {
            "dataManagementApi": "https://test_url/outside/v3.3b/",
            "dependencies": "https://test_url/outside/metadata/data/v3/dependencies",
            "oauth": "https://a/b/oauth/token",
            "openApiMetadata": "https://test_url/outside/metadata/",
            "xsdMetadata": "https://test_url/outside/metadata/xsd",
          },
          "version": "1.0.0",
        }
      `);
    });
  });
  describe('given a valid request not running in localhost', () => {
    let response: FrontendResponse;

    beforeAll(async () => {
      setupMockConfiguration();

      const event: FrontendRequest = {
        ...newFrontendRequest(),
        headers: {
          host: 'localhost:3000',
        },

        stage: 'local',
      };

      // Act
      response = await apiVersion(event);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('returns status 200', () => {
      expect(response.statusCode).toEqual(200);
    });
    it('returns the expected JSON output with https', () => {
      expect(response.body).toMatchInlineSnapshot(`
        {
          "apiMode": "SharedInstance",
          "dataModels": [
            {
              "name": "Ed-Fi",
              "version": "3.3.1-b",
            },
          ],
          "urls": {
            "dataManagementApi": "http://localhost:3000/local/v3.3b/",
            "dependencies": "http://localhost:3000/local/metadata/data/v3/dependencies",
            "oauth": "https://a/b/oauth/token",
            "openApiMetadata": "http://localhost:3000/local/metadata/",
            "xsdMetadata": "http://localhost:3000/local/metadata/xsd",
          },
          "version": "1.0.0",
        }
      `);
    });
  });
});
