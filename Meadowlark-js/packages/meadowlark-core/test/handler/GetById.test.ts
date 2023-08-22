// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getById } from '../../src/handler/GetById';
import { GetResult } from '../../src/message/GetResult';
import { FrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { PathComponents } from '../../src/model/PathComponents';
import * as PluginLoader from '../../src/plugin/PluginLoader';
import { NoDocumentStorePlugin } from '../../src/plugin/backend/NoDocumentStorePlugin';
import { DocumentUuid } from '../../src/model/IdTypes';

const validPathComponents: PathComponents = {
  resourceName: '1',
  namespace: '2',
  version: '3',
  documentUuid: '6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7' as DocumentUuid,
};

describe('given there is no resourceId', () => {
  const request: FrontendRequest = newFrontendRequest();
  let response: FrontendResponse;
  let mockDocumentStore: any;
  const metaEdHeaders = { header: 'one' };

  beforeAll(async () => {
    request.middleware.headerMetadata = metaEdHeaders;
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue(NoDocumentStorePlugin);

    // Act
    response = await getById(request);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('never calls getDocumentById', () => {
    expect(mockDocumentStore).not.toHaveBeenCalled();
  });
});

describe('given database lookup has unknown failure', () => {
  const request: FrontendRequest = newFrontendRequest();
  request.middleware.pathComponents = validPathComponents;
  let response: FrontendResponse;
  let mockDocumentStore: any;
  const metaEdHeaders = { header: 'one' };

  beforeAll(async () => {
    request.middleware.headerMetadata = metaEdHeaders;
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      getDocumentById: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
          edfiDoc: {},
          documentUuid: '' as DocumentUuid,
          lastModifiedDate: 0,
        } as GetResult),
    });

    // Act
    response = await getById(request);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('returns expected headers', () => {
    expect(response.headers).toEqual(metaEdHeaders);
  });
});

describe('given id does not exist', () => {
  const request: FrontendRequest = newFrontendRequest();
  request.middleware.pathComponents = validPathComponents;
  let response: FrontendResponse;
  let mockDocumentStore: any;
  const metaEdHeaders = { header: 'one' };

  beforeAll(async () => {
    request.middleware.headerMetadata = metaEdHeaders;
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      getDocumentById: async () =>
        Promise.resolve({
          response: 'GET_FAILURE_NOT_EXISTS',
          edfiDoc: {},
          documentUuid: '' as DocumentUuid,
          lastModifiedDate: 0,
        } as GetResult),
    });

    // Act
    response = await getById(request);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns expected headers', () => {
    expect(response.headers).toEqual(metaEdHeaders);
  });
});

describe('given a valid request', () => {
  const request: FrontendRequest = newFrontendRequest();
  request.middleware.pathComponents = validPathComponents;
  let response: FrontendResponse;
  let mockDocumentStore: any;
  const metaEdHeaders = { header: 'one' };
  const edfiDoc = { document: 'd' };

  beforeAll(async () => {
    request.middleware.headerMetadata = metaEdHeaders;
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      getDocumentById: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          edfiDoc,
          documentUuid: '' as DocumentUuid,
          lastModifiedDate: 0,
        } as GetResult),
    });

    // Act
    response = await getById(request);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns expected headers', () => {
    expect(response.headers).toEqual(metaEdHeaders);
  });

  it('returns expected document', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "_lastModifiedDate": "1970-01-01T00:00:00.000Z",
        "document": "d",
        "id": "",
      }
    `);
  });
});
