// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { upsert } from '../../src/handler/Upsert';
import { UpsertResult } from '../../src/message/UpsertResult';
import * as PluginLoader from '../../src/plugin/PluginLoader';
import * as UriBuilder from '../../src/handler/UriBuilder';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../src/handler/FrontendResponse';
import { NoDocumentStorePlugin } from '../../src/plugin/backend/NoDocumentStorePlugin';
import { ReferringDocumentInfo } from '../../src/message/ReferringDocumentInfo';
import { isDocumentUuidWellFormed } from '../../src/model/DocumentIdentity';
import { DocumentUuid, MeadowlarkId } from '../../src/model/IdTypes';
import { EndpointName } from '../../src/model/api-schema/EndpointName';
import { ProjectNamespace } from '../../src/model/api-schema/ProjectNamespace';
import { ProjectShortVersion } from '../../src/model/ProjectShortVersion';
import { MetaEdResourceName } from '../../src/model/api-schema/MetaEdResourceName';
import { MetaEdProjectName } from '../../src/model/api-schema/MetaEdProjectName';
import { SemVer } from '../../src/model/api-schema/SemVer';

const documentUuid = '3218d452-a7b7-4f1c-aa91-26ccc48cf4b8' as DocumentUuid;
const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  body: '{}',
  middleware: {
    ...newFrontendRequestMiddleware(),
    pathComponents: {
      endpointName: 'academicWeeks' as EndpointName,
      projectNamespace: 'ed-fi' as ProjectNamespace,
      projectShortVersion: 'v3.3b' as ProjectShortVersion,
    },
  },
};

describe('given persistence is going to throw a reference error on insert', () => {
  let response: FrontendResponse;
  const expectedBlockingDocument: ReferringDocumentInfo = {
    resourceName: 'resourceName' as MetaEdResourceName,
    documentUuid,
    meadowlarkId: 'meadowlarkId' as MeadowlarkId,
    projectName: 'Ed-Fi' as MetaEdProjectName,
    resourceVersion: '3.3.1-b' as SemVer,
  };
  let mockDocumentStore: any;
  let mockUriBuilder: any;
  const expectedError = 'Error message';

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      upsertDocument: async () =>
        Promise.resolve({
          response: 'INSERT_FAILURE_REFERENCE',
          failureMessage: expectedError,
          referringDocumentInfo: [expectedBlockingDocument],
        }),
    });
    mockUriBuilder = jest.spyOn(UriBuilder, 'blockingDocumentsToUris').mockReturnValue(['blocking/uri']);

    // Act
    response = await upsert(frontendRequest);
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
        "error": "Error message",
      }
    `);
  });
});

describe('given upsert has write conflict failure', () => {
  let response: FrontendResponse;
  let mockDocumentStore: any;
  const expectedError = 'Write conflict due to concurrent access to this or related resources';

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      upsertDocument: async () =>
        Promise.resolve({
          response: 'UPSERT_FAILURE_WRITE_CONFLICT',
          failureMessage: expectedError,
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

  it('has a failure message', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "error": "Write conflict due to concurrent access to this or related resources",
      }
    `);
  });
});

describe('given persistence is going to throw a conflict error on insert', () => {
  let response: FrontendResponse;
  const expectedBlockingDocument: ReferringDocumentInfo = {
    resourceName: 'resourceName' as MetaEdResourceName,
    documentUuid,
    meadowlarkId: 'meadowlarkId' as MeadowlarkId,
    projectName: 'Ed-Fi' as MetaEdProjectName,
    resourceVersion: '3.3.1-b' as SemVer,
  };
  let mockDocumentStore: any;
  let mockUriBuilder: any;
  const expectedError = 'Error message';

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      upsertDocument: async () =>
        Promise.resolve({
          response: 'INSERT_FAILURE_CONFLICT',
          failureMessage: expectedError,
          referringDocumentInfo: [expectedBlockingDocument],
        }),
    });
    mockUriBuilder = jest.spyOn(UriBuilder, 'blockingDocumentsToUris').mockReturnValue(['blocking/uri']);

    // Act
    response = await upsert(frontendRequest);
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
        "error": "Error message",
      }
    `);
  });
});

describe('given persistence is going to throw a reference error on update though did not on insert attempt', () => {
  let response: FrontendResponse;
  const expectedBlockingDocument: ReferringDocumentInfo = {
    resourceName: 'resourceName' as MetaEdResourceName,
    documentUuid,
    meadowlarkId: 'meadowlarkId' as MeadowlarkId,
    projectName: 'Ed-Fi' as MetaEdProjectName,
    resourceVersion: '3.3.1-b' as SemVer,
  };
  let mockDocumentStore: any;
  let mockUriBuilder: any;

  beforeAll(async () => {
    mockDocumentStore = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue({
      ...NoDocumentStorePlugin,
      upsertDocument: async () =>
        Promise.resolve({
          response: 'UPDATE_FAILURE_REFERENCE',
          failureMessage: 'Reference failure',
          referringDocumentInfo: [expectedBlockingDocument],
        }),
    });
    mockUriBuilder = jest.spyOn(UriBuilder, 'blockingDocumentsToUris').mockReturnValue(['blocking/uri']);

    // Act
    response = await upsert(frontendRequest);
  });

  afterAll(() => {
    mockDocumentStore.mockRestore();
    mockUriBuilder.mockRestore();
  });

  it('returns status 409', () => {
    expect(response.statusCode).toEqual(409);
  });

  it('returns an appropriate message', () => {
    expect(response.body).toMatchInlineSnapshot(`
      {
        "blockingUris": [
          "blocking/uri",
        ],
        "error": "Reference failure",
      }
    `);
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
    expect(response.body).toBeUndefined();
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
          newDocumentUuid: '6b48af60-afe7-4df2-b783-dc614ec9bb64',
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
    expect(response.body).toBeUndefined();
  });

  it('it returns headers', () => {
    const location = /\/v3.3b\/ed-fi\/academicWeeks\/[a-z,0-9,-]{36,36}/i;
    expect(JSON.parse(JSON.stringify(response.headers)).Location).toMatch(location);
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
          existingDocumentUuid: documentUuid,
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
    expect(response.body).toBeUndefined();
  });

  it('returns Location header with resource and uuid', () => {
    const location = JSON.parse(JSON.stringify(response.headers)).Location;

    const expectedPrefix = '/v3.3b/ed-fi/academicWeeks/';
    expect(location.startsWith(expectedPrefix)).toBe(true);

    const uuidSuffix = location.slice(expectedPrefix.length);
    expect(isDocumentUuidWellFormed(uuidSuffix)).toBe(true);
  });
});
