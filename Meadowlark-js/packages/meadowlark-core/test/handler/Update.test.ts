// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { update } from '../../src/handler/Update';
import * as PluginLoader from '../../src/plugin/PluginLoader';
import { FrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { documentIdForDocumentInfo } from '../../src/model/DocumentInfo';
import { NoDocumentStorePlugin } from '../../src/plugin/backend/NoDocumentStorePlugin';

process.env.ACCESS_TOKEN_REQUIRED = 'false';

const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  body: '{}',
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      resourceName: 'academicWeeks',
      namespace: 'ed-fi',
      version: 'v3.3b',
      resourceId: 'TBD',
    },
  },
};
// resourceId must match id of document body
frontendRequest.middleware.pathComponents.resourceId = documentIdForDocumentInfo(
  frontendRequest.middleware.resourceInfo,
  frontendRequest.middleware.documentInfo,
);

describe('given the requested document does not exist', () => {
  let response: FrontendResponse;
  let mockDocumentStore: any;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      updateDocumentById: async () =>
        Promise.resolve({
          response: 'UPDATE_FAILURE_NOT_EXISTS',
          failureMessage: 'Does not exist',
        }),
    });

    // Act
    response = await update(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns no error message', () => {
    expect(response.body).toEqual('');
  });
});

describe('given the new document has an invalid reference ', () => {
  let mockDocumentStore: any;
  const expectedError = 'Error';
  let response: FrontendResponse;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      updateDocumentById: async () =>
        Promise.resolve({
          response: 'UPDATE_FAILURE_REFERENCE',
          failureMessage: expectedError,
        }),
    });

    // Act
    response = await update(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns the persistence error message', () => {
    expect(JSON.parse(response.body).message).toEqual(expectedError);
  });
});

describe('given the update succeeds', () => {
  let mockDocumentStore: any;
  let response: FrontendResponse;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      updateDocumentById: async () =>
        Promise.resolve({
          response: 'UPDATE_SUCCESS',
        }),
    });

    // Act
    response = await update(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 204', () => {
    expect(response.statusCode).toEqual(204);
  });

  it('does not return a message body', () => {
    expect(response.body).toEqual('');
  });
});

describe('given the resourceId of the update does not match the id derived from the body', () => {
  let mockDocumentStore: any;
  let response: FrontendResponse;

  const badFrontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    body: '{}',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: {
        resourceName: 'academicWeeks',
        namespace: 'ed-fi',
        version: 'v3.3b',
        resourceId: 'Will not match',
      },
    },
  };

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      updateDocumentById: async () =>
        Promise.resolve({
          response: 'UPDATE_SUCCESS',
        }),
    });

    // Act
    response = await update(badFrontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns a failure message body', () => {
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"message\\":\\"The identity of the resource does not match the identity in the updated document.\\"}"`,
    );
  });
});
