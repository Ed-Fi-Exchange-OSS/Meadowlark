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
import { MongoClient } from 'mongodb';
import { getCollection, getNewClient } from '../../src/repository/Db';
import { rejectByOwnershipSecurity } from '../../src/repository/OwnershipSecurity';
import { upsertDocument } from '../../src/repository/Upsert';

jest.setTimeout(40000);

describe('given the upsert where no document id is specified', () => {
  let client;
  let result;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'upsert',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents(), resourceId: null },
    },
  };

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // Act
    result = await rejectByOwnershipSecurity(frontendRequest, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should not apply security when no document id is specified', async () => {
    expect(result).toBe('NOT_APPLICABLE');
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
      pathComponents: { ...newPathComponents(), resourceId: 'DOESNOTEXIST' },
    },
  };

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // Act
    result = await rejectByOwnershipSecurity(frontendRequest, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should not apply security for non-existent document', async () => {
    expect(result).toBe('NOT_APPLICABLE');
  });
});

describe('given the getById of a document owned by the requestor', () => {
  let client;
  let result;

  const authorizationStrategy = 'OWNERSHIP_BASED';
  const clientName = 'ThisClient';

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'get2' }],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  const upsertRequest = {
    id,
    resourceInfo,
    documentInfo,
    edfiDoc: {},
    validate: false,
    security: { authorizationStrategy, clientName } as Security,
    traceId: 'traceId',
  };

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'getById',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents(), resourceId: id },
      security: { authorizationStrategy, clientName },
    },
  };

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // Insert owned document
    await upsertDocument(upsertRequest, client);

    // Act
    result = await rejectByOwnershipSecurity(frontendRequest, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should approve access for owned document', async () => {
    expect(result).toBe('ACCESS_APPROVED');
  });
});

describe('given the getById of a document not owned by the requestor', () => {
  let client;
  let result;

  const authorizationStrategy = 'OWNERSHIP_BASED';

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'get2' }],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  const upsertRequest = {
    id,
    resourceInfo,
    documentInfo,
    edfiDoc: {},
    validate: false,
    security: { authorizationStrategy, clientName: 'DocumentOwner' } as Security,
    traceId: 'traceId',
  };

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'getById',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents(), resourceId: id },
      security: { authorizationStrategy, clientName: 'NotTheDocumentOwner' },
    },
  };

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // Insert non-owned document
    await upsertDocument(upsertRequest, client);

    // Act
    result = await rejectByOwnershipSecurity(frontendRequest, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should approve access for owned document', async () => {
    expect(result).toBe('ACCESS_DENIED');
  });
});
