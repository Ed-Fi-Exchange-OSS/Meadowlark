// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config, Environment, initializeLogging, getBooleanFromEnvironment } from '@edfi/meadowlark-utilities';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../../src/handler/FrontendResponse';
import { update } from '../../../src/handler/FrontendFacade';
import * as Publish from '../../../src/plugin/listener/Publish';
import { NoDocumentStorePlugin } from '../../../src/plugin/backend/NoDocumentStorePlugin';
import * as PluginLoader from '../../../src/plugin/PluginLoader';
import { MiddlewareModel } from '../../../src/middleware/MiddlewareModel';
import * as AuthorizationMiddleware from '../../../src/middleware/AuthorizationMiddleware';
import { setupMockConfiguration } from '../../ConfigHelper';
import { UpdateResult } from '../../../src/message/UpdateResult';
import { DocumentUuid } from '../../../src/model/IdTypes';
import { clearAllValidatorCache } from '../../../src/validation/ResourceSchemaValidation';
import { EndpointName } from '../../../src/model/api-schema/EndpointName';
import { ProjectNamespace } from '../../../src/model/api-schema/ProjectNamespace';
import { ProjectShortVersion } from '../../../src/model/ProjectShortVersion';

let updateResponse: FrontendResponse;
let mockUpdate: any;

const documentUuid: DocumentUuid = '6b48af60-afe7-4df2-b783-dc614ec9bb64' as DocumentUuid;
const requestPath: string = '/v3.3b/ed-fi/academicWeeks/';
const originalGetBooleanFromEnvironment = getBooleanFromEnvironment;
const baseRequestBody = {
  weekIdentifier: '123456',
  schoolReference: {
    schoolId: 123,
  },
  beginDate: '2023-10-30',
  endDate: '2023-10-30',
  totalInstructionalDays: 10,
};

const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  path: requestPath,
  body: JSON.stringify(baseRequestBody),
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      endpointName: 'academicWeeks' as unknown as EndpointName,
      projectNamespace: 'ed-fi' as unknown as ProjectNamespace,
      projectShortVersion: 'v3.3b' as unknown as ProjectShortVersion,
    },
  },
};

const frontendRequestUpdate: FrontendRequest = {
  ...frontendRequest,
  path: `${requestPath}${documentUuid}`,
  body: JSON.stringify({
    ...baseRequestBody,
    id: documentUuid,
  }),
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      endpointName: 'academicWeeks' as unknown as EndpointName,
      projectNamespace: 'ed-fi' as unknown as ProjectNamespace,
      projectShortVersion: 'v3.3b' as unknown as ProjectShortVersion,
      documentUuid: documentUuid as DocumentUuid,
    },
  },
};

const frontendRequestAdditionalProperties: FrontendRequest = {
  ...newFrontendRequest(),
  body: JSON.stringify({
    ...baseRequestBody,
    extraneousProperty: 'LoremIpsum',
    secondExtraneousProperty: 'Second additional',
  }),
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      endpointName: 'academicWeeks' as unknown as EndpointName,
      projectNamespace: 'ed-fi' as unknown as ProjectNamespace,
      projectShortVersion: 'v3.3b' as unknown as ProjectShortVersion,
    },
  },
};
const frontendRequestUpdateAdditionalProperties: FrontendRequest = {
  ...frontendRequestAdditionalProperties,
  path: `${requestPath}${documentUuid}`,
  body: JSON.stringify({
    ...baseRequestBody,
    extraneousProperty: 'LoremIpsum',
    secondExtraneousProperty: 'Second additional',
    id: documentUuid,
  }),
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      endpointName: 'academicWeeks' as unknown as EndpointName,
      projectNamespace: 'ed-fi' as unknown as ProjectNamespace,
      projectShortVersion: 'v3.3b' as unknown as ProjectShortVersion,
      documentUuid: documentUuid as DocumentUuid,
    },
  },
};

const updateResult: UpdateResult = {
  response: 'UPDATE_SUCCESS',
  failureMessage: null,
} as unknown as UpdateResult;

describe('given an update with Allow Overposting equals to false', () => {
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

  describe('when updating a document without extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest: frontendRequestUpdate,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpdateDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      mockUpdate = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        updateDocumentById: async () => Promise.resolve(updateResult),
      });
      // Act
      updateResponse = await update(frontendRequestUpdate);
    });

    afterAll(() => {
      mockUpdate.mockRestore();
    });

    it('returns status 204', () => {
      expect(updateResponse.statusCode).toEqual(204);
    });
  });

  describe('when updating a document with extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest: frontendRequestUpdateAdditionalProperties,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpdateDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      mockUpdate = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        updateDocumentById: async () => Promise.resolve(updateResult),
      });
      // Act
      updateResponse = await update(frontendRequestUpdateAdditionalProperties);
    });

    afterAll(() => {
      mockUpdate.mockRestore();
    });

    it('returns status 400', () => {
      expect(updateResponse.statusCode).toEqual(400);
    });

    it('returns error on update for extraneous properties', () => {
      expect(updateResponse.body).toMatchInlineSnapshot(`
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
          {
            "context": {
              "errorType": "additionalProperties",
            },
            "message": "'secondExtraneousProperty' property is not expected to be here",
            "path": "{requestBody}",
            "suggestion": "Did you mean property 'schoolReference'?",
          },
        ],
      }
      `);
    });
  });
});

describe('given an update with Allow Overposting equals to true', () => {
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

  describe('when updating a document without extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest: frontendRequestUpdate,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpdateDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      mockUpdate = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        updateDocumentById: async () => Promise.resolve(updateResult),
      });
      // Act
      updateResponse = await update(frontendRequestUpdate);
    });

    afterAll(() => {
      mockUpdate.mockRestore();
    });

    it('returns status 204', () => {
      expect(updateResponse.statusCode).toEqual(204);
    });
  });

  describe('when updating a document with extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest: frontendRequestUpdateAdditionalProperties,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpdateDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      mockUpdate = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        updateDocumentById: async () => Promise.resolve(updateResult),
      });
      // Act
      updateResponse = await update(frontendRequestUpdateAdditionalProperties);
    });

    afterAll(() => {
      mockUpdate.mockRestore();
    });

    it('returns status 204', () => {
      expect(updateResponse.statusCode).toEqual(204);
    });
  });
});
