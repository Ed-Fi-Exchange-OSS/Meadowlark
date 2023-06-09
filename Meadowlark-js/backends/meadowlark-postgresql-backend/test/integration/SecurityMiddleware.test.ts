// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  AuthorizationStrategy,
  meadowlarkIdForDocumentIdentity,
  DocumentInfo,
  FrontendRequest,
  MiddlewareModel,
  newDocumentInfo,
  newFrontendRequest,
  newResourceInfo,
  ResourceInfo,
  Security,
  DocumentUuid,
  UpsertRequest,
  TraceId,
} from '@edfi/meadowlark-core';
import { newFrontendRequestMiddleware } from '@edfi/meadowlark-core/src/handler/FrontendRequest';
import { newPathComponents } from '@edfi/meadowlark-core/src/model/PathComponents';
import type { PoolClient } from 'pg';
import { resetSharedClient, getSharedClient } from '../../src/repository/Db';
import { securityMiddleware } from '../../src/security/SecurityMiddleware';
import { upsertDocument } from '../../src/repository/Upsert';
import { deleteAll } from './TestHelper';

describe('given the upsert where no meadowlark id is specified', () => {
  let client: PoolClient;
  let result: MiddlewareModel;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'upsert',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents() },
    },
  };

  beforeAll(async () => {
    client = await getSharedClient();

    // Act
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should not respond when no meadowlark id is specified', async () => {
    expect(result.frontendResponse).toBeNull();
  });
});

describe('given the getById of a non-existent document', () => {
  let client: PoolClient;
  let result: MiddlewareModel;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'getById',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents(), documentUuid: '00000000-0000-0000-0000-000000000000' as DocumentUuid },
    },
  };

  beforeAll(async () => {
    client = await getSharedClient();

    // Act
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should not respond for non-existent document', async () => {
    expect(result.frontendResponse).toBeNull();
  });
});

describe('given the getById of a document owned by the requestor', () => {
  let client: PoolClient;
  let result: MiddlewareModel;

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
    client = await getSharedClient();

    // Insert owned document
    const upsertResult = await upsertDocument(upsertRequest, client);
    const documentUuidResult: DocumentUuid =
      upsertResult.response === 'INSERT_SUCCESS' ? upsertResult.newDocumentUuid : ('' as DocumentUuid);
    const frontendRequest: FrontendRequest = {
      ...newFrontendRequest(),
      action: 'getById',
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: { ...newPathComponents(), documentUuid: documentUuidResult },
        security: { authorizationStrategy, clientId },
        validateResources: true,
      },
    };
    // Act
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should not respond for approved access for owned document', async () => {
    expect(result.frontendResponse).toBeNull();
  });
});

describe('given the getById of a document not owned by the requestor', () => {
  let client: PoolClient;
  let result: MiddlewareModel;

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
    client = await getSharedClient();

    // Insert non-owned document
    const upsertResult = await upsertDocument(upsertRequest, client);

    const documentUuid: DocumentUuid =
      upsertResult.response === 'INSERT_SUCCESS' ? upsertResult.newDocumentUuid : ('' as DocumentUuid);
    const frontendRequest: FrontendRequest = {
      ...newFrontendRequest(),
      action: 'getById',
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: { ...newPathComponents(), documentUuid },
        security: { authorizationStrategy, clientId: 'NotTheDocumentOwner' },
        validateResources: true,
      },
    };

    // Act
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should respond 403 for access denied', async () => {
    expect(result.frontendResponse?.statusCode).toBe(403);
  });
});
