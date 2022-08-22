// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { upsert } from '../../src/handler/Upsert';
import { UpsertResult } from '../../src/message/UpsertResult';
import * as PluginLoader from '../../src/plugin/PluginLoader';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../src/handler/FrontendResponse';
import { NoDocumentStorePlugin } from '../../src/plugin/backend/NoDocumentStorePlugin';

process.env.ACCESS_TOKEN_REQUIRED = 'false';

const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  body: '{}',
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      endpointName: 'academicWeeks',
      namespace: 'ed-fi',
      version: 'v3.3b',
      resourceId: null,
    },
  },
};

describe('given persistence is going to throw a reference error on insert', () => {
  let response: FrontendResponse;
  let mockDocumentStore: any;
  const expectedError = 'Error';

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      upsertDocument: async () =>
        Promise.resolve({
          response: 'INSERT_FAILURE_REFERENCE',
          failureMessage: expectedError,
        }),
    });

    // Act
    response = await upsert(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns an error message', () => {
    expect(JSON.parse(response.body).message).toEqual(expectedError);
  });
});

describe('given persistence is going to throw a reference error on update though did not on insert attempt', () => {
  let response: FrontendResponse;
  let mockDocumentStore: any;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      upsertDocument: async () =>
        Promise.resolve({
          response: 'UPDATE_FAILURE_REFERENCE',
          failureMessage: 'Reference failure',
        }),
    });

    // Act
    response = await upsert(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 409', () => {
    expect(response.statusCode).toEqual(409);
  });

  it('does not return a message body', () => {
    expect(response.body).toEqual('');
  });
});

describe('given persistence is going to fail', () => {
  let response: FrontendResponse;
  let mockDocumentStore: any;
  const expectedError = 'Error';

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      upsertDocument: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
          failureMessage: expectedError,
        }),
    });

    // Act
    response = await upsert(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('does not return a message body', () => {
    expect(response.body).toEqual('');
  });
});

describe('given persistence succeeds as insert', () => {
  let response: FrontendResponse;
  let mockDocumentStore: any;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      upsertDocument: async () =>
        Promise.resolve({
          response: 'INSERT_SUCCESS',
          failureMessage: null,
        } as unknown as UpsertResult),
    });

    // Act
    response = await upsert(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 201', () => {
    expect(response.statusCode).toEqual(201);
  });

  it('does not return a message body', () => {
    expect(response.body).toEqual('');
  });

  it('it returns headers', () => {
    const location = `/v3.3b/ed-fi/academicWeeks/aquYJFOsedv9pkccRrndKwuojRMjOz_rdD7rJA`;
    expect(response.headers).toEqual({ Location: location });
  });
});

describe('given persistence succeeds as update', () => {
  let response: FrontendResponse;
  let mockDocumentStore: any;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      upsertDocument: async () =>
        Promise.resolve({
          response: 'UPDATE_SUCCESS',
          failureMessage: null,
        } as unknown as UpsertResult),
    });

    // Act
    response = await upsert(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('does not return a message body', () => {
    expect(response.body).toEqual('');
  });

  it('it returns headers', () => {
    const location = `/v3.3b/ed-fi/academicWeeks/aquYJFOsedv9pkccRrndKwuojRMjOz_rdD7rJA`;
    expect(response.headers).toEqual({ Location: location });
  });
});
