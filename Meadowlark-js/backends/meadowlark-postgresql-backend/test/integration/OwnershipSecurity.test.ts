// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  documentIdForDocumentInfo,
  DocumentInfo,
  FrontendRequest,
  newDocumentInfo,
  newFrontendRequest,
  newResourceInfo,
  ResourceInfo,
  Security,
} from '@edfi/meadowlark-core';
import { newFrontendRequestMiddleware } from '@edfi/meadowlark-core/src/handler/FrontendRequest';
import { newPathComponents } from '@edfi/meadowlark-core/src/model/PathComponents';
import type { PoolClient } from 'pg';
import { getSharedClient, resetSharedClient } from '../../src/repository/Db';
import { deleteAll } from './TestHelper';
import { rejectByOwnershipSecurity } from '../../src/repository/OwnershipSecurity';
import { upsertDocument } from '../../src/repository/Upsert';
import { SecurityResult } from '../../src/security/SecurityResponse';

jest.setTimeout(40000);

describe('given the upsert where no document id is specified', () => {
  let client: PoolClient;
  let result: SecurityResult;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'upsert',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents(), resourceId: null },
    },
  };

  beforeAll(async () => {
    client = await getSharedClient();

    // Act
    result = await rejectByOwnershipSecurity(frontendRequest, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should not apply security when no document id is specified', async () => {
    expect(result).toBe('NOT_APPLICABLE');
  });
});

describe('given the getById of a non-existent document', () => {
  let client: PoolClient;
  let result: SecurityResult;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'getById',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents(), resourceId: 'DOESNOTEXIST' },
    },
  };

  beforeAll(async () => {
    client = await getSharedClient();

    // Act
    result = await rejectByOwnershipSecurity(frontendRequest, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should not apply security for non-existent document', async () => {
    expect(result).toBe('NOT_APPLICABLE');
  });
});

describe('given the getById of a document owned by the requestor', () => {
  let client: PoolClient;
  let result: SecurityResult;

  const authorizationStrategy = 'OWNERSHIP_BASED';
  const clientId = 'ThisClient';

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'get2' },
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  const upsertRequest = {
    id,
    resourceInfo,
    documentInfo,
    edfiDoc: {},
    validate: false,
    security: { authorizationStrategy, clientId } as Security,
    traceId: 'traceId',
  };

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'getById',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents(), resourceId: id },
      security: { authorizationStrategy, clientId },
      validateResources: true,
    },
  };

  beforeAll(async () => {
    client = await getSharedClient();

    // Insert owned document
    await upsertDocument(upsertRequest, client);

    // Act
    result = await rejectByOwnershipSecurity(frontendRequest, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should approve access for owned document', async () => {
    expect(result).toBe('ACCESS_APPROVED');
  });
});

describe('given the getById of a document not owned by the requestor', () => {
  let client: PoolClient;
  let result: SecurityResult;

  const authorizationStrategy = 'OWNERSHIP_BASED';

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'get2' },
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  const upsertRequest = {
    id,
    resourceInfo,
    documentInfo,
    edfiDoc: {},
    validate: false,
    security: { authorizationStrategy, clientId: 'DocumentOwner' } as Security,
    traceId: 'traceId',
  };

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'getById',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents(), resourceId: id },
      security: { authorizationStrategy, clientId: 'NotTheDocumentOwner' },
      validateResources: true,
    },
  };

  beforeAll(async () => {
    client = await getSharedClient();

    // Insert non-owned document
    await upsertDocument(upsertRequest, client);

    // Act
    result = await rejectByOwnershipSecurity(frontendRequest, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should approve access for owned document', async () => {
    expect(result).toBe('ACCESS_DENIED');
  });
});
