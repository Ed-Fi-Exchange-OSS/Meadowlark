// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DocumentInfo,
  NoDocumentInfo,
  newDocumentInfo,
  newSecurity,
  documentIdForDocumentInfo,
  GetRequest,
  UpsertRequest,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  GetResult,
} from '@edfi/meadowlark-core';
import type { PoolClient } from 'pg';
import { resetSharedClient, getSharedClient } from '../../src/repository/Db';
import { deleteAll } from './TestHelper';
import { getDocumentById } from '../../src/repository/Get';
import { findDocumentByIdSql } from '../../src/repository/SqlHelper';
import { upsertDocument } from '../../src/repository/Upsert';
import { setupConfigForIntegration } from './Config';

jest.setTimeout(40000);

const newGetRequest = (): GetRequest => ({
  meadowlarkId: '',
  documentUuid: 'deb6ea15-fa93-4389-89a8-1428fb617490',
  resourceInfo: NoResourceInfo,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

const newUpsertRequest = (): UpsertRequest => ({
  meadowlarkId: '',
  documentUuid: 'eeb6ea15-fa93-4389-89a8-1428fb617490',
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validate: false,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

describe('given the get of a non-existent document', () => {
  let client: PoolClient;
  let getResult: GetResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'get1' },
  };
  const meadowlarkId = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = await getSharedClient();

    getResult = await getDocumentById({ ...newGetRequest(), meadowlarkId, resourceInfo }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should not exist in the db', async () => {
    const result = await client.query(findDocumentByIdSql(meadowlarkId));

    expect(result.rowCount).toBe(0);
  });

  it('should return get failure', async () => {
    expect(getResult.response).toBe('GET_FAILURE_NOT_EXISTS');
  });
});

describe('given the get of an existing document', () => {
  let client: PoolClient;
  let getResult: any;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'get2' },
  };
  const meadowlarkId = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = await getSharedClient();
    const upsertRequest: UpsertRequest = { ...newUpsertRequest(), meadowlarkId, documentInfo, edfiDoc: { inserted: 'yes' } };

    // insert the initial version
    await upsertDocument(upsertRequest, client);

    getResult = await getDocumentById({ ...newGetRequest(), meadowlarkId, resourceInfo }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should return the document', async () => {
    expect(getResult.response).toBe('GET_SUCCESS');
    expect(getResult.document.inserted).toBe('yes');
  });
});
