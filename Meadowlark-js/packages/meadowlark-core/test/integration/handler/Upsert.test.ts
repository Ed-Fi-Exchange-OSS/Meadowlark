// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config, Environment, initializeLogging, getBooleanFromEnvironment } from '@edfi/meadowlark-utilities';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../../src/handler/FrontendResponse';
import { upsert } from '../../../src/handler/FrontendFacade';
import * as Publish from '../../../src/plugin/listener/Publish';
import { NoDocumentStorePlugin } from '../../../src/plugin/backend/NoDocumentStorePlugin';
import * as PluginLoader from '../../../src/plugin/PluginLoader';
import { MiddlewareModel } from '../../../src/middleware/MiddlewareModel';
import * as AuthorizationMiddleware from '../../../src/middleware/AuthorizationMiddleware';
import * as ParsePathMiddleware from '../../../src/middleware/ParsePathMiddleware';
import { setupMockConfiguration } from '../../ConfigHelper';
import { UpsertResult } from '../../../src/message/UpsertResult';
import { clearAllValidatorCache } from '../../../src/metaed/MetaEdValidation';

let upsertResponse: FrontendResponse;
let mockUpsert: any;

const originalGetBooleanFromEnvironment = getBooleanFromEnvironment;

const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  body: `{
    "weekIdentifier": "123456",
    "schoolReference": {
      "schoolId": 123
    },
    "beginDate": "2023-10-30",
    "endDate": "2023-10-30",
    "totalInstructionalDays": 10
  }`,
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      resourceName: 'academicWeeks',
      namespace: 'ed-fi',
      version: 'v3.3b',
    },
  },
};

const frontendRequestAdditionalProperties: FrontendRequest = {
  ...newFrontendRequest(),
  body: `{
    "weekIdentifier": "123456",
    "schoolReference": {
      "schoolId": 123
    },
    "beginDate": "2023-10-30",
    "endDate": "2023-10-30",
    "extraneousProperty": "LoremIpsum",
    "totalInstructionalDays": 10
  }`,
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      resourceName: 'academicWeeks',
      namespace: 'ed-fi',
      version: 'v3.3b',
    },
  },
};

describe('given an upsert with Allow Overposting equals to false', () => {
  beforeAll(async () => {
    clearAllValidatorCache();
    setupMockConfiguration();
    initializeLogging();
    jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue(NoDocumentStorePlugin);
    jest.spyOn(Environment, 'getBooleanFromEnvironment').mockImplementation((key: Config.ConfigKeys) => {
      if (key === 'ALLOW_OVERPOSTING') {
        return false;
      }
      return originalGetBooleanFromEnvironment(key, false);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('when upserting a document without extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpsertDocument').mockImplementation(async () => Promise.resolve());
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      jest.spyOn(ParsePathMiddleware, 'parsePath').mockResolvedValue(model);
      mockUpsert = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        upsertDocument: async () =>
          Promise.resolve({
            response: 'INSERT_SUCCESS',
            newDocumentUuid: '6b48af60-afe7-4df2-b783-dc614ec9bb64',
            failureMessage: null,
          } as unknown as UpsertResult),
      });
      // Act
      upsertResponse = await upsert(frontendRequest);
    });

    afterAll(() => {
      mockUpsert.mockRestore();
    });

    it('returns status 201', () => {
      expect(upsertResponse.statusCode).toEqual(201);
    });
  });

  describe('when upserting a document with extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest: frontendRequestAdditionalProperties,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpsertDocument').mockImplementation(async () => Promise.resolve());
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      jest.spyOn(ParsePathMiddleware, 'parsePath').mockResolvedValue(model);
      mockUpsert = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        upsertDocument: async () =>
          Promise.resolve({
            response: 'INSERT_SUCCESS',
            newDocumentUuid: '6b48af60-afe7-4df2-b783-dc614ec9bb64',
            failureMessage: null,
          } as unknown as UpsertResult),
      });
      // Act
      upsertResponse = await upsert(frontendRequestAdditionalProperties);
    });

    afterAll(() => {
      mockUpsert.mockRestore();
    });

    it('returns status 400', () => {
      expect(upsertResponse.statusCode).toEqual(400);
    });

    it('returns error on Upsert for extraneous properties', () => {
      expect(upsertResponse.body).toMatchInlineSnapshot(`
      {
        "error": [
          {
            "context": {
              "errorType": "additionalProperties",
            },
            "message": "'extraneousProperty' property is not expected to be here",
            "path": "{requestBody}",
            "suggestion": "Did you mean property 'weekIdentifier'?",
          },
        ],
      }
      `);
    });
  });
});

describe('given an upsert with Allow Overposting equals to true', () => {
  beforeAll(async () => {
    clearAllValidatorCache();
    setupMockConfiguration();
    initializeLogging();
    jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue(NoDocumentStorePlugin);
    jest.spyOn(Environment, 'getBooleanFromEnvironment').mockImplementation((key: Config.ConfigKeys) => {
      if (key === 'ALLOW_OVERPOSTING') {
        return true;
      }
      return originalGetBooleanFromEnvironment(key, false);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('when upserting a document without extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpsertDocument').mockImplementation(async () => Promise.resolve());
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      jest.spyOn(ParsePathMiddleware, 'parsePath').mockResolvedValue(model);
      mockUpsert = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        upsertDocument: async () =>
          Promise.resolve({
            response: 'INSERT_SUCCESS',
            newDocumentUuid: '6b48af60-afe7-4df2-b783-dc614ec9bb64',
            failureMessage: null,
          } as unknown as UpsertResult),
      });
      // Act
      upsertResponse = await upsert(frontendRequest);
    });

    afterAll(() => {
      mockUpsert.mockRestore();
    });

    it('returns status 201', () => {
      expect(upsertResponse.statusCode).toEqual(201);
    });
  });

  describe('when upserting a document with extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest: frontendRequestAdditionalProperties,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpsertDocument').mockImplementation(async () => Promise.resolve());
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      jest.spyOn(ParsePathMiddleware, 'parsePath').mockResolvedValue(model);
      mockUpsert = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        upsertDocument: async () =>
          Promise.resolve({
            response: 'INSERT_SUCCESS',
            newDocumentUuid: '6b48af60-afe7-4df2-b783-dc614ec9bb64',
            failureMessage: null,
          } as unknown as UpsertResult),
      });
      // Act
      upsertResponse = await upsert(frontendRequestAdditionalProperties);
    });

    afterAll(() => {
      mockUpsert.mockRestore();
    });

    it('returns status 201', () => {
      expect(upsertResponse.statusCode).toEqual(201);
    });
  });
});
