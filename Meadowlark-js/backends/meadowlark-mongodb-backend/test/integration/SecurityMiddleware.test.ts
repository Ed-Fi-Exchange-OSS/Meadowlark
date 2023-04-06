// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  AuthorizationStrategy,
  meadowlarkIdForDocumentIdentity,
  DocumentInfo,
  FrontendRequest,
  newDocumentInfo,
  newFrontendRequest,
  newResourceInfo,
  ResourceInfo,
  Security,
  DocumentUuid,
  UpsertRequest,
  TraceId,
  UpsertResult,
} from '@edfi/meadowlark-core';
import { newFrontendRequestMiddleware } from '@edfi/meadowlark-core/src/handler/FrontendRequest';
import { newPathComponents } from '@edfi/meadowlark-core/src/model/PathComponents';
import { MongoClient } from 'mongodb';
import { getDocumentCollection, getNewClient } from '../../src/repository/Db';
import { securityMiddleware } from '../../src/security/SecurityMiddleware';
import { upsertDocument } from '../../src/repository/Upsert';
import { setupConfigForIntegration } from './Config';

describe('given the upsert where no document id is specified', () => {
  let client;
  let result;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'upsert',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents() },
    },
  };

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // Act
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should not respond when no document id is specified', async () => {
    expect(result.frontendResponse).toBeNull();
  });
});

describe('given the getById of a non-existent document', () => {
  let client;
  let result;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'getById',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents(), documentUuid: '00000000-0000-0000-0000-000000000000' as DocumentUuid },
    },
  };

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // Act
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should not respond for non-existent document', async () => {
    expect(result.frontendResponse).toBeNull();
  });
});

describe('given the getById of a document owned by the requestor', () => {
  let client;
  let upsertResult: UpsertResult;
  let result;

  const authorizationStrategy: AuthorizationStrategy = { type: 'OWNERSHIP_BASED' };
  const clientId = 'ThisClient';

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'get2' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  const upsertRequest: UpsertRequest = {
    meadowlarkId,
    resourceInfo,
    documentInfo,
    edfiDoc: {},
    validateDocumentReferencesExist: false,
    security: { authorizationStrategy, clientId } as Security,
    traceId: 'traceId' as TraceId,
  };

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // Insert owned document
    upsertResult = await upsertDocument(upsertRequest, client);
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    const frontendRequest: FrontendRequest = {
      ...newFrontendRequest(),
      action: 'getById',
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: { ...newPathComponents(), documentUuid: upsertResult.newDocumentUuid },
        security: { authorizationStrategy, clientId },
        validateResources: true,
      },
    };

    // Act
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should not respond for approved access for owned document', async () => {
    expect(result.frontendResponse).toBeNull();
  });
});

describe('given the getById of a document not owned by the requestor', () => {
  let client;
  let upsertResult: UpsertResult;
  let result;

  const authorizationStrategy: AuthorizationStrategy = { type: 'OWNERSHIP_BASED' };

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'get2' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  const upsertRequest: UpsertRequest = {
    meadowlarkId,
    resourceInfo,
    documentInfo,
    edfiDoc: {},
    validateDocumentReferencesExist: false,
    security: { authorizationStrategy, clientId: 'DocumentOwner' } as Security,
    traceId: 'traceId' as TraceId,
  };

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // Insert non-owned document
    upsertResult = await upsertDocument(upsertRequest, client);
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    const frontendRequest: FrontendRequest = {
      ...newFrontendRequest(),
      action: 'getById',
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: { ...newPathComponents(), documentUuid: upsertResult.newDocumentUuid },
        security: { authorizationStrategy, clientId: 'NotTheDocumentOwner' },
        validateResources: true,
      },
    };

    // Act
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should respond 403 for access denied', async () => {
    expect(result.frontendResponse.statusCode).toBe(403);
  });
});
