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
} from '@edfi/meadowlark-core';
import { Client } from 'pg';
import { closeDB, getSharedClient } from '../../src/repository/Db';
import { deleteAll } from '../../src/repository/Delete';
import { getDocumentById } from '../../src/repository/Get';
import { getRecordExistsSql } from '../../src/repository/QueryHelper';
import { upsertDocument } from '../../src/repository/Upsert';

jest.setTimeout(40000);

const newGetRequest = (): GetRequest => ({
  id: '',
  resourceInfo: NoResourceInfo,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

const newUpsertRequest = (): UpsertRequest => ({
  id: '',
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validate: false,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

describe('given the get of a non-existent document', () => {
  let client;
  let getResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'get1' }],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    client = (await getSharedClient()) as Client;

    getResult = await getDocumentById({ ...newGetRequest(), id, resourceInfo }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    await closeDB();
  });

  it('should not exist in the db', async () => {
    const result = await client.query(await getRecordExistsSql(id));

    expect(result.rowCount).toBe(0);
  });

  it('should return get failure', async () => {
    expect(getResult.response).toBe('GET_FAILURE_NOT_EXISTS');
  });
});

describe('given the get of an existing document', () => {
  let client;
  let getResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'get2' }],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    client = (await getSharedClient()) as Client;
    const upsertRequest: UpsertRequest = { ...newUpsertRequest(), id, documentInfo, edfiDoc: { inserted: 'yes' } };

    // insert the initial version
    await upsertDocument(upsertRequest, client);

    getResult = await getDocumentById({ ...newGetRequest(), id, resourceInfo }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    await closeDB();
  });

  it('should return the document', async () => {
    expect(getResult.response).toBe('GET_SUCCESS');
    expect(getResult.document.edfiDoc.inserted).toBe('yes');
  });
});
