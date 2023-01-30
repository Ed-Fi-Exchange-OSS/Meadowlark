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
import { Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getDocumentCollection, getNewClient } from '../../src/repository/Db';
import { getDocumentById } from '../../src/repository/Get';
import { upsertDocument } from '../../src/repository/Upsert';
import { setupConfigForIntegration } from './Config';

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
    documentIdentity: { natural: 'get1' },
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    getResult = await getDocumentById({ ...newGetRequest(), id }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should not exist in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: id });
    expect(result).toBe(null);
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
    documentIdentity: { natural: 'get2' },
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = { ...newUpsertRequest(), id, documentInfo, edfiDoc: { inserted: 'yes' } };

    // insert the initial version
    await upsertDocument(upsertRequest, client);

    getResult = await getDocumentById({ ...newGetRequest(), id, resourceInfo }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return the document', async () => {
    expect(getResult.response).toBe('GET_SUCCESS');
    expect(getResult.document.inserted).toBe('yes');
  });
});
