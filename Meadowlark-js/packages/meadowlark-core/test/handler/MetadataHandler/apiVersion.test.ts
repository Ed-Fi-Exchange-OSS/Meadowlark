// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { apiVersion } from '../../../src/handler/MetadataHandler';

describe('when getting API version information', () => {
  describe('given a valid request not running in localhost', () => {
    process.env.TOKEN_URL = 'mock_oauth';
    let response: APIGatewayProxyResult;
    const EXPECTED_OUTPUT_HTTPS = `{
    "version": "5.3",
    "informationalVersion": "5.3",
    "suite": "3",
    "build": "5.3.663.0",
    "apiMode": "Sandbox",
    "dataModels": [
      {
        "name": "Ed-Fi",
        "version": "3.3.1-b"
      }
    ],
    "urls": {
      "dependencies": "",
      "openApiMetadata": "https://test_url/outside/metadata/",
      "oauth": "mock_oauth",
      "dataManagementApi": "https://test_url/outside/v3.3b/",
      "xsdMetadata": ""
    }
  }`;

    beforeAll(async () => {
      const event: APIGatewayProxyEvent = {
        headers: {
          Host: 'test_url',
        },
        requestContext: {
          stage: 'outside',
        },
      } as any;
      const context = {
        awsRequestId: 'aaaa',
      } as any;

      // Act
      response = await apiVersion(event, context);
    });

    it('returns status 200', () => {
      expect(response.statusCode).toEqual(200);
    });
    it('returns the expected JSON output with https', () => {
      expect(response.body).toEqual(EXPECTED_OUTPUT_HTTPS);
    });
  });
  describe('given a valid request not running in localhost', () => {
    process.env.TOKEN_URL = 'mock_oauth';
    let response: APIGatewayProxyResult;

    const EXPECTED_OUTPUT_HTTP = `{
    "version": "5.3",
    "informationalVersion": "5.3",
    "suite": "3",
    "build": "5.3.663.0",
    "apiMode": "Sandbox",
    "dataModels": [
      {
        "name": "Ed-Fi",
        "version": "3.3.1-b"
      }
    ],
    "urls": {
      "dependencies": "",
      "openApiMetadata": "http://localhost:3000/local/metadata/",
      "oauth": "mock_oauth",
      "dataManagementApi": "http://localhost:3000/local/v3.3b/",
      "xsdMetadata": ""
    }
  }`;

    beforeAll(async () => {
      const event: APIGatewayProxyEvent = {
        headers: {
          Host: 'localhost:3000',
        },
        requestContext: {
          stage: 'local',
        },
      } as any;
      const context = {
        awsRequestId: 'aaaa',
      } as any;

      // Act
      response = await apiVersion(event, context);
    });

    it('returns status 200', () => {
      expect(response.statusCode).toEqual(200);
    });
    it('returns the expected JSON output with https', () => {
      expect(response.body).toEqual(EXPECTED_OUTPUT_HTTP);
    });
  });
});
