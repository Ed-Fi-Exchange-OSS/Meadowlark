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
  Security,
} from '@edfi/meadowlark-core';
import { newFrontendRequestMiddleware } from '@edfi/meadowlark-core/src/handler/FrontendRequest';
import { newPathComponents } from '@edfi/meadowlark-core/src/model/PathComponents';
import { MongoClient } from 'mongodb';
import { getCollection, getNewClient } from '../../src/repository/Db';
import { securityMiddleware } from '../../src/security/SecurityMiddleware';
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
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
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
      pathComponents: { ...newPathComponents(), resourceId: 'DOESNOTEXIST' },
    },
  };

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // Act
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should not respond for non-existent document', async () => {
    expect(result.frontendResponse).toBeNull();
  });
});

describe('given the getById of a document owned by the requestor', () => {
  let client;
  let result;

  const authorizationStrategy = 'OWNERSHIP_BASED';
  const clientName = 'ThisClient';

  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'get2' }],
  };
  const id = documentIdForDocumentInfo(documentInfo);

  const upsertRequest = {
    id,
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
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should not respond for approved access for owned document', async () => {
    expect(result.frontendResponse).toBeNull();
  });
});

describe('given the getById of a document not owned by the requestor', () => {
  let client;
  let result;

  const authorizationStrategy = 'OWNERSHIP_BASED';

  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'get2' }],
  };
  const id = documentIdForDocumentInfo(documentInfo);

  const upsertRequest = {
    id,
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
    result = await securityMiddleware({ frontendRequest, frontendResponse: null }, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should respond 403 for access denied', async () => {
    expect(result.frontendResponse.statusCode).toBe(403);
  });
});
