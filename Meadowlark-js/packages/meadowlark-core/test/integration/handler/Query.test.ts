// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config, Environment, initializeLogging, getBooleanFromEnvironment } from '@edfi/meadowlark-utilities';
import { clearAllValidatorCache } from '../../../src/validation/ResourceSchemaValidation';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../../src/handler/FrontendResponse';
import { QueryResult } from '../../../src/message/QueryResult';
import { EndpointName } from '../../../src/model/api-schema/EndpointName';
import { ProjectNamespace } from '../../../src/model/api-schema/ProjectNamespace';
import { ProjectShortVersion } from '../../../src/model/ProjectShortVersion';
import { NoDocumentStorePlugin } from '../../../src/plugin/backend/NoDocumentStorePlugin';
import { setupMockConfiguration } from '../../ConfigHelper';
import { query } from '../../../src/handler/FrontendFacade';
import * as PluginLoader from '../../../src/plugin/PluginLoader';
import { MiddlewareModel } from '../../../src/middleware/MiddlewareModel';
import * as AuthorizationMiddleware from '../../../src/middleware/AuthorizationMiddleware';

const originalGetBooleanFromEnvironment = getBooleanFromEnvironment;
const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  queryParameters: {
    weekIdentifier: 'weekIdentifier',
  },
  body: '{}',
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      endpointName: 'academicWeeks' as EndpointName,
      projectNamespace: 'ed-fi' as ProjectNamespace,
      projectShortVersion: 'v3.3b' as ProjectShortVersion,
    },
  },
};

const frontendRequestAdditionalProperties: FrontendRequest = {
  ...frontendRequest,
  queryParameters: {
    ...frontendRequest.queryParameters,
    extraneousProperty1: 'extraneousProperty1',
    extraneousProperty2: 'extraneousProperty2',
  },
  body: '{}',
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      endpointName: 'academicWeeks' as EndpointName,
      projectNamespace: 'ed-fi' as ProjectNamespace,
      projectShortVersion: 'v3.3b' as ProjectShortVersion,
    },
  },
};

// eslint-disable-next-line no-template-curly-in-string
describe.each([true, false])('given a query with ALLOW_OVERPOSTING: %p', (allowOverposting) => {
  beforeAll(async () => {
    clearAllValidatorCache();
    setupMockConfiguration();
    initializeLogging();
    jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue(NoDocumentStorePlugin);
    jest.spyOn(Environment, 'getBooleanFromEnvironment').mockImplementation((key: Config.ConfigKeys) => {
      if (key === 'ALLOW_OVERPOSTING') {
        return allowOverposting;
      }
      return originalGetBooleanFromEnvironment(key, false);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('when querying a document without additional properties', () => {
    let response: FrontendResponse;
    let mockQueryHandler: any;
    const goodResult: object = { goodResult: 'result' };
    const headers: object = [{ totalCount: '1' }];

    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest,
        frontendResponse: null,
      };
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      mockQueryHandler = jest.spyOn(PluginLoader, 'getQueryHandler').mockReturnValue({
        ...NoDocumentStorePlugin,
        queryDocuments: async () =>
          Promise.resolve({
            response: 'QUERY_SUCCESS',
            documents: [goodResult],
            Headers: headers,
          } as unknown as QueryResult),
      });

      // Act
      response = await query(frontendRequest);
    });

    afterAll(() => {
      mockQueryHandler.mockRestore();
    });

    it('returns status 200', () => {
      expect(response.statusCode).toEqual(200);
    });

    it('returns total count of 1', () => {
      expect(headers[0].totalCount).toEqual('1');
    });

    it('returns 1 result', () => {
      expect(response.body).toHaveLength(1);
    });

    it('returns expected object', () => {
      expect(response.body).toMatchInlineSnapshot(
        `
      [
        {
          "goodResult": "result",
        },
      ]
    `,
      );
    });
  });

  describe('when querying a document with additional properties', () => {
    let response: FrontendResponse;
    let mockQueryHandler: jest.SpyInstance;
    const goodResult: object = { goodResult: 'result' };
    const headers: object = [{ totalCount: '1' }];

    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest: frontendRequestAdditionalProperties,
        frontendResponse: null,
      };
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      mockQueryHandler = jest.spyOn(PluginLoader, 'getQueryHandler').mockReturnValue({
        ...NoDocumentStorePlugin,
        queryDocuments: async () =>
          Promise.resolve({
            response: 'QUERY_SUCCESS',
            documents: [goodResult],
            Headers: headers,
          } as unknown as QueryResult),
      });

      // Act
      response = await query(frontendRequestAdditionalProperties);
    });

    afterAll(() => {
      mockQueryHandler.mockRestore();
    });

    it('returns status 400', () => {
      expect(response.statusCode).toEqual(400);
    });

    it('returns total count of 1', () => {
      expect(headers[0].totalCount).toEqual('1');
    });

    it('returns error object', () => {
      expect(response.body).toMatchInlineSnapshot(
        `
        {
          "error": "The request is invalid.",
          "modelState": {
            "AcademicWeek does not include property 'extraneousProperty1'": "Invalid property",
            "AcademicWeek does not include property 'extraneousProperty2'": "Invalid property",
          },
        }
    `,
      );
    });
  });
});
