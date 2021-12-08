// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import axios from 'axios';
import { swaggerForResourcesAPI, resourceCache } from '../../../src/handler/MetadataHandler';
import { Constants } from '../../../src/Constants';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('when getting Swagger resources', () => {
  // eslint-disable-next-line no-return-assign
  beforeAll(() => (process.env.TOKEN_URL = 'https://a/b/c'));

  afterAll(() => {
    delete process.env.TOKEN_URL;

    delete resourceCache[Constants.swaggerResourceUrl];
  });

  describe('given the swagger resource does not exist upstream', () => {
    let response: APIGatewayProxyResult;

    beforeAll(async () => {
      const event: APIGatewayProxyEvent = {
        headers: {
          Host: 'localhost:3000',
        },
        requestContext: {
          stage: 'outside',
        },
      } as any;
      const context = {
        awsRequestId: 'aaaa',
      };

      mockedAxios.get.mockRejectedValue({ data: 'whatever' });

      // Act
      response = await swaggerForResourcesAPI(event, context as Context);
    });

    it('returns status 404', () => {
      expect(response.statusCode).toEqual(404);
    });
    it('returns the expected JSON output', () => {
      expect(response.body).toEqual('');
    });
    it('retrieves the correct resource from AWS', () => {
      expect(mockedAxios.get.mock.calls[0][0]).toEqual(Constants.swaggerResourceUrl);
    });
  });

  describe('given the swagger resource exists', () => {
    describe('and given the current version has been retrieved before', () => {
      let response: APIGatewayProxyResult;

      const ETAG = 'metaed';
      const EXPECTED_OUTPUT = '{ "basePath": "/outside/v3.3b/", "tokenUrl": "https://a/b/c", "host": "localhost:3000" }';

      beforeAll(async () => {
        const event: APIGatewayProxyEvent = {
          headers: {
            Host: 'localhost:3000',
          },
          requestContext: {
            stage: 'outside',
          },
        } as any;
        const context = {
          awsRequestId: 'aaaa',
        };

        const resp = { status: 304, headers: { etag: ETAG } };
        mockedAxios.get.mockResolvedValue(resp);

        // Inject the expected resource into the cache
        resourceCache[Constants.swaggerResourceUrl] = { body: EXPECTED_OUTPUT, etag: ETAG };

        // Act
        response = await swaggerForResourcesAPI(event, context as Context);
      });

      it('returns status 200', () => {
        expect(response.statusCode).toEqual(200);
      });
      it('returns the expected JSON output', () => {
        expect(response.body).toEqual(EXPECTED_OUTPUT);
      });
      it('retrieves the correct resource from AWS', () => {
        expect(mockedAxios.get.mock.calls[0][0]).toEqual(Constants.swaggerResourceUrl);
      });
    });

    describe('and given an older version has been retrieved before', () => {
      let response: APIGatewayProxyResult;

      const OLD_ETAG = 'meat-ed';
      const NEW_ETAG = 'metaed';
      const RAW_FILE = '{ "basePath": "{{ basePath }}", "tokenUrl": "{{ tokenUrl }}", "host": "{{ host }}" }';
      const CACHED_OUTPUT = `"{n  "https://a/b/c"n    }"`;
      const EXPECTED_OUTPUT = '{ "basePath": "/outside/v3.3b/", "tokenUrl": "https://a/b/c", "host": "localhost:3000" }';

      beforeAll(async () => {
        const event: APIGatewayProxyEvent = {
          headers: {
            Host: 'localhost:3000',
          },
          requestContext: {
            stage: 'outside',
          },
        } as any;
        const context = {
          awsRequestId: 'aaaa',
        };

        const resp = { data: RAW_FILE, status: 200, headers: { etag: NEW_ETAG } };
        mockedAxios.get.mockResolvedValue(resp);

        // Inject the old resource into the cache
        resourceCache[Constants.swaggerResourceUrl] = { body: CACHED_OUTPUT, etag: OLD_ETAG };

        // Act
        response = await swaggerForResourcesAPI(event, context as Context);
      });

      it('returns status 200', () => {
        expect(response.statusCode).toEqual(200);
      });
      it('returns the expected JSON output', () => {
        expect(response.body).toEqual(EXPECTED_OUTPUT);
      });
      it('updates the cache', () => {
        expect(resourceCache[Constants.swaggerResourceUrl].body).toEqual(EXPECTED_OUTPUT);
        expect(resourceCache[Constants.swaggerResourceUrl].etag).toEqual(NEW_ETAG);
      });
      it('retrieves the correct resource from AWS', () => {
        expect(mockedAxios.get.mock.calls[0][0]).toEqual(Constants.swaggerResourceUrl);
      });
    });

    describe('and given it has not been retrieved before', () => {
      let response: APIGatewayProxyResult;

      const ETAG = 'metaed';
      const RAW_FILE = '{ "basePath": "{{ basePath }}", "tokenUrl": "{{ tokenUrl }}", "host": "{{ host }}" }';
      const EXPECTED_OUTPUT = '{ "basePath": "/outside/v3.3b/", "tokenUrl": "https://a/b/c", "host": "localhost:3000" }';

      beforeAll(async () => {
        const event: APIGatewayProxyEvent = {
          headers: {
            Host: 'localhost:3000',
          },
          requestContext: {
            stage: 'outside',
          },
        } as any;
        const context = {
          awsRequestId: 'aaaa',
        };

        const resp = { data: RAW_FILE, status: 200, headers: { etag: ETAG } };
        mockedAxios.get.mockResolvedValue(resp);

        // Act
        response = await swaggerForResourcesAPI(event, context as Context);
      });

      it('returns status 200', () => {
        expect(response.statusCode).toEqual(200);
      });
      it('returns the expected JSON output', () => {
        expect(response.body).toEqual(EXPECTED_OUTPUT);
      });
      it('updates the cache', () => {
        expect(resourceCache[Constants.swaggerResourceUrl].body).toEqual(EXPECTED_OUTPUT);
        expect(resourceCache[Constants.swaggerResourceUrl].etag).toEqual(ETAG);
      });
      it('retrieves the correct resource from AWS', () => {
        expect(mockedAxios.get.mock.calls[0][0]).toEqual(Constants.swaggerResourceUrl);
      });
    });
  });
});
