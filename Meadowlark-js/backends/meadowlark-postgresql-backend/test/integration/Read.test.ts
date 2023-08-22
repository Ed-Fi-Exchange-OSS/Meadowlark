// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DocumentInfo,
  NoDocumentInfo,
  newDocumentInfo,
  newSecurity,
  meadowlarkIdForDocumentIdentity,
  GetRequest,
  UpsertRequest,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  GetResult,
  DocumentUuid,
  TraceId,
  MeadowlarkId,
} from '@edfi/meadowlark-core';
import type { PoolClient } from 'pg';
import { resetSharedClient, getSharedClient } from '../../src/repository/Db';
import { deleteAll } from './TestHelper';
import { getDocumentByDocumentUuid } from '../../src/repository/Get';
import { findDocumentByMeadowlarkId } from '../../src/repository/SqlHelper';
import { upsertDocument } from '../../src/repository/Upsert';
import { MeadowlarkDocument, NoMeadowlarkDocument } from '../../src/model/MeadowlarkDocument';

const newGetRequest = (): GetRequest => ({
  documentUuid: 'deb6ea15-fa93-4389-89a8-1428fb617490' as DocumentUuid,
  resourceInfo: NoResourceInfo,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

const newUpsertRequest = (): UpsertRequest => ({
  meadowlarkId: '' as MeadowlarkId,
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
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
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);
  const documentUuid = 'ffb6ea15-fa93-4389-89a8-1428fb617490' as DocumentUuid;

  beforeAll(async () => {
    client = await getSharedClient();

    getResult = await getDocumentByDocumentUuid({ ...newGetRequest(), documentUuid, resourceInfo }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should not exist in the db', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, meadowlarkId);

    expect(result).toBe(NoMeadowlarkDocument);
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
    requestTimestamp: 1000,
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    client = await getSharedClient();
    const upsertRequest: UpsertRequest = { ...newUpsertRequest(), meadowlarkId, documentInfo, edfiDoc: { inserted: 'yes' } };
    let resultDocumentUuid: DocumentUuid;
    // insert the initial version
    const upsertResult = await upsertDocument(upsertRequest, client);
    if (upsertResult.response === 'INSERT_SUCCESS') {
      resultDocumentUuid = upsertResult.newDocumentUuid;
    } else if (upsertResult.response === 'UPDATE_SUCCESS') {
      resultDocumentUuid = upsertResult.existingDocumentUuid;
    } else {
      resultDocumentUuid = '' as DocumentUuid;
    }
    getResult = await getDocumentByDocumentUuid(
      { ...newGetRequest(), documentUuid: resultDocumentUuid, resourceInfo },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should return the document', async () => {
    expect(getResult.response).toBe('GET_SUCCESS');
    expect(getResult.edfiDoc.inserted).toBe('yes');
    expect(getResult.lastModifiedDate).toBe(1000);
  });
});
