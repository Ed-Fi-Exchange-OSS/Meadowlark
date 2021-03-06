// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { deleteIt } from '../../src/handler/Delete';
import * as PluginLoader from '../../src/plugin/PluginLoader';
import { FrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { NoDocumentStorePlugin } from '../../src/plugin/backend/NoDocumentStorePlugin';

const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      endpointName: 'academicWeeks',
      namespace: 'ed-fi',
      version: 'v3.3b',
      resourceId: 'TBD',
    },
  },
};

describe('given there is no resourceId', () => {
  let response: FrontendResponse;
  let mockDocumentStore: any;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue(NoDocumentStorePlugin);

    // Act
    response = await deleteIt(newFrontendRequest());
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('has an empty body', () => {
    expect(response.body).toEqual('');
  });

  it('never calls deleteDocumentById', () => {
    expect(mockDocumentStore).not.toHaveBeenCalled();
  });
});

describe('given delete has unknown failure', () => {
  let response: FrontendResponse;
  const expectedError = 'Error';
  let mockDocumentStore: any;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      deleteDocumentById: () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
          failureMessage: expectedError,
        }),
    });

    // Act
    response = await deleteIt(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('has a failure message', () => {
    expect(JSON.parse(response.body).message).toEqual(expectedError);
  });
});

describe('given id does not exist', () => {
  let response: FrontendResponse;
  let mockDocumentStore: any;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      deleteDocumentById: () =>
        Promise.resolve({
          response: 'DELETE_FAILURE_NOT_EXISTS',
        }),
    });

    // Act
    response = await deleteIt(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('has an empty body', () => {
    expect(response.body).toEqual('');
  });
});

describe('given the document to be deleted is referenced by other documents ', () => {
  let mockDocumentStore: any;
  const expectedError = 'Error';
  let response: FrontendResponse;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      deleteDocumentById: () =>
        Promise.resolve({
          response: 'DELETE_FAILURE_REFERENCE',
          failureMessage: expectedError,
        }),
    });

    // Act
    response = await deleteIt(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 409', () => {
    expect(response.statusCode).toEqual(409);
  });

  it('returns the error message', () => {
    expect(JSON.parse(response.body).message).toEqual(expectedError);
  });
});

describe('given a valid request', () => {
  let response: FrontendResponse;
  let mockDocumentStore: any;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      deleteDocumentById: () =>
        Promise.resolve({
          response: 'DELETE_SUCCESS',
        }),
    });

    // Act
    response = await deleteIt(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 204', () => {
    expect(response.statusCode).toEqual(204);
  });

  it('has an empty body', () => {
    expect(response.body).toEqual('');
  });
});
