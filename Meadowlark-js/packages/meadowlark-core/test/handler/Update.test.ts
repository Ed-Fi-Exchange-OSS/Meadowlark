// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { update } from '../../src/handler/Update';
import * as PluginLoader from '../../src/plugin/PluginLoader';
import * as UriBuilder from '../../src/handler/UriBuilder';
import { FrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { NoDocumentStorePlugin } from '../../src/plugin/backend/NoDocumentStorePlugin';
import { ReferringDocumentInfo } from '../../src/message/ReferringDocumentInfo';
import { DocumentUuid, MeadowlarkId } from '../../src/model/IdTypes';
import { EndpointName } from '../../src/model/api-schema/EndpointName';
import { ProjectNamespace } from '../../src/model/api-schema/ProjectNamespace';
import { ProjectShortVersion } from '../../src/model/ProjectShortVersion';
import { MetaEdResourceName } from '../../src/model/api-schema/MetaEdResourceName';
import { MetaEdProjectName } from '../../src/model/api-schema/MetaEdProjectName';
import { SemVer } from '../../src/model/api-schema/SemVer';

const documentUuid = '2edb604f-eab0-412c-a242-508d6529214d' as DocumentUuid;
const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  body: '{}',
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      endpointName: 'academicWeeks' as EndpointName,
      projectNamespace: 'ed-fi' as ProjectNamespace,
      projectShortVersion: 'v3.3b' as ProjectShortVersion,
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
  let mockUriBuilder: any;

  const expectedBlockingDocument: ReferringDocumentInfo = {
    resourceName: 'resourceName' as MetaEdResourceName,
    documentUuid: 'documentUuid' as DocumentUuid,
    meadowlarkId: 'meadowlarkId' as MeadowlarkId,
    projectName: 'Ed-Fi' as MetaEdProjectName,
    resourceVersion: '3.3.1-b' as SemVer,
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
          referringDocumentInfo: [expectedBlockingDocument],
        }),
    });

    mockUriBuilder = jest.spyOn(UriBuilder, 'blockingDocumentsToUris').mockReturnValue(['blocking/uri']);

    const frontendRequestTest = frontendRequest;
    frontendRequestTest.middleware.parsedBody = { id: documentUuid };
    // Act
    response = await update(frontendRequestTest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
    mockUriBuilder.mockRestore();
  });

  it('returns status 409', () => {
    expect(response.statusCode).toEqual(409);
  });

  it('returns an appropriate message', () => {
    // it should NOT return the detailed message from the database - information leakage
    expect(response.body).toMatchInlineSnapshot(`
    {
      "blockingUris": [
        "blocking/uri",
      ],
      "error": "this is the message",
    }
    `);
  });
});

describe('given update has write conflict failure', () => {
  let mockDocumentStore: any;
  const expectedError = 'Write conflict due to concurrent access to this or related resources';
  let response: FrontendResponse;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      updateDocumentById: async () =>
        Promise.resolve({
          response: 'UPDATE_FAILURE_WRITE_CONFLICT',
          failureMessage: expectedError,
        }),
    });

    // Act
    response = await update(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
  });

  it('returns status 409', () => {
    expect(response.statusCode).toEqual(409);
  });

  it('has a failure message', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": "Write conflict due to concurrent access to this or related resources",
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
