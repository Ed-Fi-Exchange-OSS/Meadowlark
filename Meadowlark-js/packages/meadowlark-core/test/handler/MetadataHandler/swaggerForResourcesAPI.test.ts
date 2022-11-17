// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import axios from 'axios';
import { swaggerForResourcesAPI, resourceCache } from '../../../src/handler/MetadataHandler';
import { Constants } from '../../../src/Constants';
import { FrontendRequest, newFrontendRequest } from '../../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../../src/handler/FrontendResponse';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('when getting Swagger resources', () => {
  // eslint-disable-next-line no-return-assign
  beforeAll(() => (process.env.OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST = 'https://a/b/oauth/token'));

  afterAll(() => {
    delete process.env.OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST;

    delete resourceCache[Constants.swaggerResourceUrl];
  });

  describe('given the swagger resource does not exist upstream', () => {
    let response: FrontendResponse;

    beforeAll(async () => {
      const event: FrontendRequest = {
        ...newFrontendRequest(),
        headers: {
          Host: 'localhost:3000',
        },
        stage: 'outside',
      };

      mockedAxios.get.mockRejectedValue({ data: 'whatever' });

      // Act
      response = await swaggerForResourcesAPI(event);
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
      let response: FrontendResponse;

      const ETAG = 'metaed';
      const EXPECTED_OUTPUT = '{ "cachingTest": "fake data" }';

      beforeAll(async () => {
        const event: FrontendRequest = {
          ...newFrontendRequest(),
          headers: {
            Host: 'localhost:3000',
          },
          stage: 'outside',
        };

        const resp = { status: 304, headers: { etag: ETAG } };
        mockedAxios.get.mockResolvedValue(resp);

        // Inject the expected resource into the cache
        resourceCache[Constants.swaggerResourceUrl] = { body: EXPECTED_OUTPUT, etag: ETAG };

        // Act
        response = await swaggerForResourcesAPI(event);
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
      let response: FrontendResponse;

      const OLD_ETAG = 'meat-ed';
      const NEW_ETAG = 'metaed';
      const RAW_FILE = '{ "basePath": "{{ basePath }}", "tokenUrl": "{{ tokenUrl }}", "host": "{{ host }}" }';
      const CACHED_OUTPUT = `"{n  "https://a/b/c"n    }"`;

      beforeAll(async () => {
        const event: FrontendRequest = {
          ...newFrontendRequest(),
          headers: {
            Host: 'localhost:3000',
          },
          stage: 'outside',
        };

        const resp = { data: RAW_FILE, status: 200, headers: { etag: NEW_ETAG } };
        mockedAxios.get.mockResolvedValue(resp);

        // Inject the old resource into the cache
        resourceCache[Constants.swaggerResourceUrl] = { body: CACHED_OUTPUT, etag: OLD_ETAG };

        // Act
        response = await swaggerForResourcesAPI(event);
      });

      it('returns status 200', () => {
        expect(response.statusCode).toEqual(200);
      });
      it('returns the expected JSON output', () => {
        expect(response.body).toMatchInlineSnapshot(
          `"{ "basePath": "/outside/v3.3b/", "tokenUrl": "https://a/b/oauth/token", "host": "localhost:3000" }"`,
        );
      });
      it('updates the cache', () => {
        expect(resourceCache[Constants.swaggerResourceUrl].body).toMatchInlineSnapshot(
          `"{ "basePath": "/outside/v3.3b/", "tokenUrl": "https://a/b/oauth/token", "host": "localhost:3000" }"`,
        );
        expect(resourceCache[Constants.swaggerResourceUrl].etag).toEqual(NEW_ETAG);
      });
      it('retrieves the correct resource from AWS', () => {
        expect(mockedAxios.get.mock.calls[0][0]).toEqual(Constants.swaggerResourceUrl);
      });
    });

    describe('and given it has not been retrieved before', () => {
      let response: FrontendResponse;

      const ETAG = 'metaed';
      const RAW_FILE = '{ "basePath": "{{ basePath }}", "tokenUrl": "{{ tokenUrl }}", "host": "{{ host }}" }';

      beforeAll(async () => {
        const event: FrontendRequest = {
          ...newFrontendRequest(),
          headers: {
            Host: 'localhost:3000',
          },
          stage: 'outside',
        };

        const resp = { data: RAW_FILE, status: 200, headers: { etag: ETAG } };
        mockedAxios.get.mockResolvedValue(resp);

        // Act
        response = await swaggerForResourcesAPI(event);
      });

      it('returns status 200', () => {
        expect(response.statusCode).toEqual(200);
      });
      it('returns the expected JSON output', () => {
        expect(response.body).toMatchInlineSnapshot(
          `"{ "basePath": "/outside/v3.3b/", "tokenUrl": "https://a/b/oauth/token", "host": "localhost:3000" }"`,
        );
      });
      it('updates the cache', () => {
        expect(resourceCache[Constants.swaggerResourceUrl].body).toMatchInlineSnapshot(
          `"{ "basePath": "/outside/v3.3b/", "tokenUrl": "https://a/b/oauth/token", "host": "localhost:3000" }"`,
        );
        expect(resourceCache[Constants.swaggerResourceUrl].etag).toEqual(ETAG);
      });
      it('retrieves the correct resource from AWS', () => {
        expect(mockedAxios.get.mock.calls[0][0]).toEqual(Constants.swaggerResourceUrl);
      });
    });
  });
});
