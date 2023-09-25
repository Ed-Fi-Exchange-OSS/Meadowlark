// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { query } from '../../src/handler/Query';
import { QueryResult } from '../../src/message/QueryResult';
import * as PluginLoader from '../../src/plugin/PluginLoader';
import { FrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { NoDocumentStorePlugin } from '../../src/plugin/backend/NoDocumentStorePlugin';

const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  body: '{}',
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      resourceName: 'academicWeeks',
      namespace: 'ed-fi',
      version: 'v3.3b',
    },
  },
};

describe('given persistence is going to fail', () => {
  let response: FrontendResponse;
  let mockQueryHandler: any;
  const expectedError = 'Error';

  beforeAll(async () => {
    mockQueryHandler = jest.spyOn(PluginLoader, 'getQueryHandler').mockReturnValue({
      ...NoDocumentStorePlugin,
      queryDocuments: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
          documents: [],
          failureMessage: expectedError,
        }),
    });

    // Act
    response = await query(frontendRequest);
  });

  afterAll(() => {
    mockQueryHandler.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('does not return a message body', () => {
    expect(response.body).toBeUndefined();
  });
});

describe('given persistence fails with connection error', () => {
  let response: FrontendResponse;
  let mockQueryHandler: any;
  const expectedError = 'Error';

  beforeAll(async () => {
    mockQueryHandler = jest.spyOn(PluginLoader, 'getQueryHandler').mockReturnValue({
      ...NoDocumentStorePlugin,
      queryDocuments: async () =>
        Promise.resolve({
          response: 'QUERY_FAILURE_CONNECTION_ERROR',
          documents: [],
          failureMessage: expectedError,
        }),
    });

    // Act
    response = await query(frontendRequest);
  });

  afterAll(() => {
    mockQueryHandler.mockRestore();
  });

  it('returns status 502', () => {
    expect(response.statusCode).toEqual(502);
  });

  it('does not return a message body', () => {
    expect(response.body).toBeUndefined();
  });
});

describe('given persistence fails with invalid query', () => {
  let response: FrontendResponse;
  let mockQueryHandler: any;
  const expectedError = 'Error';

  beforeAll(async () => {
    mockQueryHandler = jest.spyOn(PluginLoader, 'getQueryHandler').mockReturnValue({
      ...NoDocumentStorePlugin,
      queryDocuments: async () =>
        Promise.resolve({
          response: 'QUERY_FAILURE_INVALID_QUERY',
          documents: [],
          failureMessage: expectedError,
        }),
    });

    // Act
    response = await query(frontendRequest);
  });

  afterAll(() => {
    mockQueryHandler.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('does not return a message body', () => {
    expect(response.body).toBeUndefined();
  });
});

describe('given successful query result', () => {
  let response: FrontendResponse;
  let mockQueryHandler: any;
  const goodResult: object = { goodResult: 'result' };
  const headers: object = [{ totalCount: '1' }];

  beforeAll(async () => {
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
