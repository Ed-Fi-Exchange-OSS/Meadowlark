// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { update } from '../../src/handler/Update';
import * as PluginLoader from '../../src/plugin/PluginLoader';
import { FrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { NoDocumentStorePlugin } from '../../src/plugin/backend/NoDocumentStorePlugin';
import { BlockingDocument } from '../../src/message/BlockingDocument';

const documentUuid = '2edb604f-eab0-412c-a242-508d6529214d';
const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  body: '{}',
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      resourceName: 'academicWeeks',
      namespace: 'ed-fi',
      version: 'v3.3b',
      documentUuid,
    },
  },
};

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

    const frontendRequestTest = frontendRequest;
    frontendRequestTest.middleware.parsedBody = { id: documentUuid };
    // Act
    response = await update(frontendRequestTest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns no error message', () => {
    expect(response.body).toBeUndefined();
  });
});

describe('given the new document has an invalid reference ', () => {
  let mockDocumentStore: any;
  const expectedBlockingDocument: BlockingDocument = {
    resourceName: 'resourceName',
    documentUuid: 'documentId',
    projectName: 'Ed-Fi',
    resourceVersion: '3.3.1-b',
  };
  const expectedError = 'this is the message';
  let response: FrontendResponse;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      updateDocumentById: async () =>
        Promise.resolve({
          response: 'UPDATE_FAILURE_REFERENCE',
          failureMessage: expectedError,
          blockingDocuments: [expectedBlockingDocument],
        }),
    });

    const frontendRequestTest = frontendRequest;
    frontendRequestTest.middleware.parsedBody = { id: documentUuid };
    // Act
    response = await update(frontendRequestTest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 409', () => {
    expect(response.statusCode).toEqual(409);
  });

  it('returns an appropriate message', () => {
    // it should NOT return the detailed message from the database - information leakage
    expect(response.body).toMatchInlineSnapshot(`
    {
      "blockingUris": [
        "/v3.3b/ed-fi/resourceNames/documentId",
      ],
      "error": "this is the message",
    }
    `);
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
    const frontendRequestTest = frontendRequest;
    frontendRequestTest.middleware.parsedBody = { id: documentUuid };
    // Act
    response = await update(frontendRequestTest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 204', () => {
    expect(response.statusCode).toEqual(204);
  });

  it('does not return a message body', () => {
    expect(response.body).toBeUndefined();
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
        documentUuid: 'Will not match',
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
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": "The identity of the resource does not match the identity in the updated document.",
      }
    `);
  });
});
