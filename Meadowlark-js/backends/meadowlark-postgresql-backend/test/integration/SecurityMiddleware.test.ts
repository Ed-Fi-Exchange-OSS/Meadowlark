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
import { generateDocumentUuid } from '@edfi/meadowlark-core/src/model/DocumentIdentity';
import { resetSharedClient, getSharedClient } from '../../src/repository/Db';
import { securityMiddleware } from '../../src/security/SecurityMiddleware';
import { upsertDocument } from '../../src/repository/Upsert';
import { deleteAll } from './TestHelper';
import { setupConfigForIntegration } from './Config';

describe('given the upsert where no document id is specified', () => {
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
    await setupConfigForIntegration();

    client = await getSharedClient();

    // Act
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should not respond when no document id is specified', async () => {
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
    await setupConfigForIntegration();

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
  const documentUuid = generateDocumentUuid();

  const upsertRequest: UpsertRequest = {
    meadowlarkId,
    resourceInfo,
    documentInfo,
    edfiDoc: {},
    validateDocumentReferencesExist: false,
    security: { authorizationStrategy, clientId } as Security,
    traceId: 'traceId' as TraceId,
  };

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'getById',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents(), documentUuid },
      security: { authorizationStrategy, clientId },
      validateResources: true,
    },
  };

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = await getSharedClient();

    // Insert owned document
    await upsertDocument(upsertRequest, client);

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

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'getById',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents(), documentUuid: meadowlarkId as unknown as DocumentUuid },
      security: { authorizationStrategy, clientId: 'NotTheDocumentOwner' },
      validateResources: true,
    },
  };

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = await getSharedClient();

    // Insert non-owned document
    await upsertDocument(upsertRequest, client);

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
