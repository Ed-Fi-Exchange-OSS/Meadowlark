// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config, Environment, initializeLogging, getBooleanFromEnvironment } from '@edfi/meadowlark-utilities';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../../src/handler/FrontendResponse';
import { getById, upsert, update } from '../../../src/handler/FrontendFacade';
import * as Publish from '../../../src/plugin/listener/Publish';
import { NoDocumentStorePlugin } from '../../../src/plugin/backend/NoDocumentStorePlugin';
import * as PluginLoader from '../../../src/plugin/PluginLoader';
import { MiddlewareModel } from '../../../src/middleware/MiddlewareModel';
import * as AuthorizationMiddleware from '../../../src/middleware/AuthorizationMiddleware';
import * as ParsePathMiddleware from '../../../src/middleware/ParsePathMiddleware';
import { setupMockConfiguration } from '../../ConfigHelper';
import { UpsertResult } from '../../../src/message/UpsertResult';
import { clearAllValidatorCache } from '../../../src/metaed/MetaEdValidation';
import { GetResult } from '../../../src/message/GetResult';
import { DocumentUuid } from '../../../src/model/IdTypes';
import { restoreSpies } from '../../TestHelper';
import { UpdateResult } from '../../../src/message/UpdateResult';

let upsertResponse: FrontendResponse;
let updateResponse: FrontendResponse;
let getResponse: FrontendResponse;
let mockDocumentStore: jest.SpyInstance;
let mockAuthorizationMiddleware: jest.SpyInstance;
let documentUuid: DocumentUuid;
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
const updateRequestBody = {
  ...baseRequestBody,
};
const updateResponseBody = {
  ...updateRequestBody,
  _lastModifiedDate: '1970-01-01T00:00:00.000Z',
};
const requestBodyAdditionalProperties = {
  ...updateRequestBody,
  extraneousProperty: 'LoremIpsum',
  secondExtraneousProperty: 'Second additional',
};
const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  path: '/v3.3b/ed-fi/academicWeeks/',
  body: JSON.stringify(baseRequestBody),
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
  ...frontendRequest,
  body: JSON.stringify(requestBodyAdditionalProperties),
};

const upsertResult: UpsertResult = {
  response: 'INSERT_SUCCESS',
  newDocumentUuid: '6b48af60-afe7-4df2-b783-dc614ec9bb64',
  failureMessage: null,
} as unknown as UpsertResult;

const updateResult: UpdateResult = {
  response: 'UPDATE_SUCCESS',
  failureMessage: null,
} as unknown as UpdateResult;

const getResult: GetResult = {
  response: 'GET_SUCCESS',
  edfiDoc: undefined as unknown as object,
  documentUuid: '6b48af60-afe7-4df2-b783-dc614ec9bb64' as DocumentUuid,
  lastModifiedDate: 0,
};

describe('given a get with ALLOW_OVERPOSTING equals to false', () => {
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

  afterEach(() => {
    restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
  });

  describe('when getting a document after invoke an upsert without extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest,
        frontendResponse: null,
      };
      mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        upsertDocument: async () => Promise.resolve(upsertResult),
      });
      jest.spyOn(Publish, 'afterUpsertDocument').mockImplementation(async () => Promise.resolve());
      mockAuthorizationMiddleware = jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      // Act
      upsertResponse = await upsert(frontendRequest);
      documentUuid = <DocumentUuid>(
        (upsertResponse?.headers?.Location.split('/').pop() ?? (undefined as unknown as DocumentUuid))
      );
      restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
      // Finally, we want to get the document we just created.
      // Prepare request to invoke get.
      const FrontEndGetRequest: FrontendRequest = {
        ...frontendRequestAdditionalProperties,
        path: `${frontendRequestAdditionalProperties.path}${documentUuid}`,
        middleware: {
          ...frontendRequestAdditionalProperties.middleware,
          pathComponents: {
            ...frontendRequestAdditionalProperties.middleware.pathComponents,
            documentUuid,
          },
        },
      };
      const getModel: MiddlewareModel = {
        frontendRequest: FrontEndGetRequest,
        frontendResponse: null,
      };
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(getModel);
      jest.spyOn(Publish, 'afterGetDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        getDocumentById: async () =>
          Promise.resolve({
            ...getResult,
            edfiDoc: frontendRequestAdditionalProperties.middleware.parsedBody,
          }),
      });
      // Act
      getResponse = await getById(FrontEndGetRequest);
    });

    it('returns status 201 on Upsert', () => {
      expect(upsertResponse.statusCode).toEqual(201);
    });

    it('returns status 200 on Get', () => {
      expect(getResponse.statusCode).toEqual(200);
    });

    it('should not return extraneous properties', () => {
      expect(getResponse.body).toEqual(
        expect.objectContaining({
          ...baseRequestBody,
          id: documentUuid,
        }),
      );
    });
  });

  describe('when getting a document after invoke an upsert that fails with extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest: frontendRequestAdditionalProperties,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpsertDocument').mockImplementation(async () => Promise.resolve());
      mockAuthorizationMiddleware = jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        upsertDocument: async () => Promise.resolve(upsertResult),
      });
      // Act
      upsertResponse = await upsert(frontendRequestAdditionalProperties);
      documentUuid = <DocumentUuid>(
        (upsertResponse?.headers?.Location?.split('/').pop() ?? (undefined as unknown as DocumentUuid))
      );
      restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
      // Finally, we want to get the document we just created.
      // Prepare request to invoke get.
      const FrontEndGetRequest: FrontendRequest = {
        ...frontendRequestAdditionalProperties,
        path: `${frontendRequestAdditionalProperties.path}${documentUuid}`,
        middleware: {
          ...frontendRequestAdditionalProperties.middleware,
          pathComponents: {
            ...frontendRequestAdditionalProperties.middleware.pathComponents,
            documentUuid,
          },
        },
      };
      const getModel: MiddlewareModel = {
        frontendRequest: FrontEndGetRequest,
        frontendResponse: null,
      };
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(getModel);
      jest.spyOn(Publish, 'afterGetDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        getDocumentById: async () =>
          Promise.resolve({
            ...getResult,
            edfiDoc: frontendRequestAdditionalProperties.middleware.parsedBody,
          }),
      });
      // Act
      getResponse = await getById(FrontEndGetRequest);
    });

    afterAll(() => {
      restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
    });

    it('returns status 400 on Upsert', () => {
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

    it('returns status 404 on Get', () => {
      expect(getResponse.statusCode).toEqual(404);
    });
  });

  describe('when getting a document after invoke an update that fails with extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpsertDocument').mockImplementation(async () => Promise.resolve());
      mockAuthorizationMiddleware = jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        upsertDocument: async () => Promise.resolve(upsertResult),
      });
      // Act
      upsertResponse = await upsert(frontendRequest);
      documentUuid = <DocumentUuid>(
        (upsertResponse?.headers?.Location?.split('/').pop() ?? (undefined as unknown as DocumentUuid))
      );
      restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
      const FrontEndUpdateRequest: FrontendRequest = {
        ...frontendRequestAdditionalProperties,
        path: `${frontendRequestAdditionalProperties.path}${documentUuid}`,
        body: JSON.stringify({
          ...requestBodyAdditionalProperties,
          id: documentUuid,
        }),
        middleware: {
          ...frontendRequestAdditionalProperties.middleware,
          pathComponents: {
            ...frontendRequestAdditionalProperties.middleware.pathComponents,
            documentUuid,
          },
        },
      };
      const getUpdateModel: MiddlewareModel = {
        frontendRequest: FrontEndUpdateRequest,
        frontendResponse: null,
      };
      mockAuthorizationMiddleware = jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(getUpdateModel);
      jest.spyOn(Publish, 'afterUpdateDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(ParsePathMiddleware, 'parsePath').mockResolvedValue(getUpdateModel);
      mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        updateDocumentById: async () => Promise.resolve(updateResult),
      });
      // Act
      updateResponse = await update(FrontEndUpdateRequest);
      documentUuid = <DocumentUuid>(
        (updateResponse?.headers?.Location?.split('/').pop() ?? (undefined as unknown as DocumentUuid))
      );
      restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
      // Finally, we want to get the document we just created.
      // Prepare request to invoke get.
      const FrontEndGetRequest: FrontendRequest = {
        ...frontendRequestAdditionalProperties,
        path: `${frontendRequestAdditionalProperties.path}${documentUuid}`,
        middleware: {
          ...FrontEndUpdateRequest.middleware,
          pathComponents: {
            ...FrontEndUpdateRequest.middleware.pathComponents,
            documentUuid,
          },
        },
      };
      const getModel: MiddlewareModel = {
        frontendRequest: FrontEndGetRequest,
        frontendResponse: null,
      };
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(getModel);
      jest.spyOn(Publish, 'afterGetDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        getDocumentById: async () =>
          Promise.resolve({
            ...getResult,
            edfiDoc: frontendRequestAdditionalProperties.middleware.parsedBody,
          }),
      });
      // Act
      getResponse = await getById(FrontEndGetRequest);
    });

    afterAll(() => {
      restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
    });

    it('returns status 201 on Upsert', () => {
      expect(upsertResponse.statusCode).toEqual(201);
    });

    it('returns errors on Update for extraneous properties', () => {
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

    it('returns status 404 on Get', () => {
      expect(getResponse.statusCode).toEqual(404);
    });
  });
});

describe('given a get with ALLOW_OVERPOSTING equals to true', () => {
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

  describe('when getting a document after invoke upserting without extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpsertDocument').mockImplementation(async () => Promise.resolve());
      mockAuthorizationMiddleware = jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        upsertDocument: async () => Promise.resolve(upsertResult),
      });
      // Act upsert
      upsertResponse = await upsert(frontendRequest);
      documentUuid = <DocumentUuid>(
        (upsertResponse?.headers?.Location.split('/').pop() ?? (undefined as unknown as DocumentUuid))
      );
      restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
      // Finally, we want to get the document we just created.
      // Prepare request to invoke get.
      const FrontEndGetRequest: FrontendRequest = {
        ...frontendRequest,
        path: `${frontendRequestAdditionalProperties.path}${documentUuid}`,
        middleware: {
          ...frontendRequest.middleware,
          pathComponents: {
            ...frontendRequest.middleware.pathComponents,
            documentUuid,
          },
        },
      };
      const getModel: MiddlewareModel = {
        frontendRequest: FrontEndGetRequest,
        frontendResponse: null,
      };
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(getModel);
      jest.spyOn(Publish, 'afterGetDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        getDocumentById: async () =>
          Promise.resolve({
            ...getResult,
            edfiDoc: frontendRequestAdditionalProperties.middleware.parsedBody,
          }),
      });
      // Act
      getResponse = await getById(FrontEndGetRequest);
    });

    it('returns status 200', () => {
      expect(getResponse.statusCode).toEqual(200);
    });

    it('should not return extraneous properties', () => {
      expect(getResponse.body).toEqual(
        expect.objectContaining({
          ...baseRequestBody,
          id: documentUuid,
        }),
      );
    });
  });
  // when getting a document after invoke upserting it with extraneous properties
  describe('when getting a document after invoke upserting with extraneous properties', () => {
    beforeAll(async () => {
      // First, we need to create a insert a document with extraneous properties.
      const model: MiddlewareModel = {
        frontendRequest: frontendRequestAdditionalProperties,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpsertDocument').mockImplementation(async () => Promise.resolve());
      mockAuthorizationMiddleware = jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        upsertDocument: async () => Promise.resolve(upsertResult),
      });
      // Act upsert
      upsertResponse = await upsert(frontendRequestAdditionalProperties);
      documentUuid = <DocumentUuid>(
        (upsertResponse?.headers?.Location.split('/').pop() ?? (undefined as unknown as DocumentUuid))
      );
      restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
      // Finally, we want to get the document we just created.
      // Prepare request to invoke get.
      const FrontEndGetRequest: FrontendRequest = {
        ...frontendRequestAdditionalProperties,
        path: `${frontendRequestAdditionalProperties.path}${documentUuid}`,
        middleware: {
          ...frontendRequestAdditionalProperties.middleware,
          pathComponents: {
            ...frontendRequestAdditionalProperties.middleware.pathComponents,
            documentUuid,
          },
        },
      };
      const getModel: MiddlewareModel = {
        frontendRequest: FrontEndGetRequest,
        frontendResponse: null,
      };
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(getModel);
      jest.spyOn(Publish, 'afterGetDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        getDocumentById: async () =>
          Promise.resolve({
            ...getResult,
            edfiDoc: frontendRequestAdditionalProperties.middleware.parsedBody,
          }),
      });
      // Act
      getResponse = await getById(FrontEndGetRequest);
    });

    it('returns status 200', () => {
      expect(getResponse.statusCode).toEqual(200);
    });

    it('should not return extraneous properties', () => {
      expect(getResponse.body).toEqual(
        expect.objectContaining({
          ...updateResponseBody,
          id: documentUuid,
        }),
      );
    });
  });

  describe('when getting a document after invoke an update with extraneous properties', () => {
    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest,
        frontendResponse: null,
      };
      jest.spyOn(Publish, 'afterUpsertDocument').mockImplementation(async () => Promise.resolve());
      mockAuthorizationMiddleware = jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        upsertDocument: async () => Promise.resolve(upsertResult),
      });
      // Act
      upsertResponse = await upsert(frontendRequest);
      documentUuid = <DocumentUuid>(
        (upsertResponse?.headers?.Location?.split('/').pop() ?? (undefined as unknown as DocumentUuid))
      );
      restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
      const FrontEndUpdateRequest: FrontendRequest = {
        ...frontendRequestAdditionalProperties,
        path: `${frontendRequestAdditionalProperties.path}${documentUuid}`,
        body: JSON.stringify({
          ...requestBodyAdditionalProperties,
          id: documentUuid,
        }),
        middleware: {
          ...frontendRequestAdditionalProperties.middleware,
          pathComponents: {
            ...frontendRequestAdditionalProperties.middleware.pathComponents,
            documentUuid,
          },
        },
      };
      const getUpdateModel: MiddlewareModel = {
        frontendRequest: FrontEndUpdateRequest,
        frontendResponse: null,
      };
      mockAuthorizationMiddleware = jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(getUpdateModel);
      jest.spyOn(Publish, 'afterUpdateDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(ParsePathMiddleware, 'parsePath').mockResolvedValue(getUpdateModel);
      mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        updateDocumentById: async () => Promise.resolve(updateResult),
      });
      // Act
      updateResponse = await update(FrontEndUpdateRequest);
      restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
      // Finally, we want to get the document we just created.
      // Prepare request to invoke get.
      const FrontEndGetRequest: FrontendRequest = {
        ...frontendRequestAdditionalProperties,
        path: `${frontendRequestAdditionalProperties.path}${documentUuid}`,
        middleware: {
          ...FrontEndUpdateRequest.middleware,
          pathComponents: {
            ...FrontEndUpdateRequest.middleware.pathComponents,
            documentUuid,
          },
        },
      };
      const getModel: MiddlewareModel = {
        frontendRequest: FrontEndGetRequest,
        frontendResponse: null,
      };
      jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(getModel);
      jest.spyOn(Publish, 'afterGetDocumentById').mockImplementation(async () => Promise.resolve());
      jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
        ...NoDocumentStorePlugin,
        getDocumentById: async () =>
          Promise.resolve({
            ...getResult,
            edfiDoc: frontendRequestAdditionalProperties.middleware.parsedBody,
          }),
      });
      // Act
      getResponse = await getById(FrontEndGetRequest);
    });

    afterAll(() => {
      restoreSpies([mockDocumentStore, mockAuthorizationMiddleware]);
    });

    it('returns status 201 on Upsert', () => {
      expect(upsertResponse.statusCode).toEqual(201);
    });

    it('returns 204 on Update for extraneous properties', () => {
      expect(updateResponse.statusCode).toEqual(204);
    });

    it('returns status 200 on Get', () => {
      expect(getResponse.statusCode).toEqual(200);
    });

    it('get should not return extraneous properties', () => {
      expect(getResponse.body).toEqual(
        expect.objectContaining({
          ...updateRequestBody,
          id: documentUuid,
        }),
      );
    });
  });
});
