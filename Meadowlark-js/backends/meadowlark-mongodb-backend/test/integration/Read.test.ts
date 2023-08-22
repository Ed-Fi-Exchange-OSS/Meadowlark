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
  TraceId,
  MeadowlarkId,
  DocumentUuid,
  UpdateRequest,
} from '@edfi/meadowlark-core';
import { Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getDocumentCollection, getNewClient } from '../../src/repository/Db';
import { getDocumentByDocumentUuid } from '../../src/repository/Get';
import { upsertDocument } from '../../src/repository/Upsert';
import { setupConfigForIntegration } from './Config';
import { updateDocumentByDocumentUuid } from '../../src/repository/Update';

const newGetRequest = (): GetRequest => ({
  documentUuid: '' as DocumentUuid,
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

const newUpdateRequest = (): UpdateRequest => ({
  meadowlarkId: '' as MeadowlarkId,
  documentUuid: '' as DocumentUuid,
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
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
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    getResult = await getDocumentByDocumentUuid({ ...newGetRequest(), documentUuid: '123' as DocumentUuid }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should not exist in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
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
    requestTimestamp: 1683326572053,
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      documentInfo,
      edfiDoc: { inserted: 'yes' },
    };

    // insert the initial version
    const upsertResult = await upsertDocument(upsertRequest, client);
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    getResult = await getDocumentByDocumentUuid(
      { ...newGetRequest(), documentUuid: upsertResult.newDocumentUuid, resourceInfo },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return the document', async () => {
    expect(getResult.response).toBe('GET_SUCCESS');
    expect(getResult.edfiDoc.inserted).toBe('yes');
  });

  it('should return the lastmodifiedDate', async () => {
    expect(getResult.response).toBe('GET_SUCCESS');
    expect(getResult.lastModifiedDate).toBe(1683326572053);
  });
});

describe('given the get of an updated document', () => {
  let client;
  let getResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo1: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'getUpdatedDocument' },
    requestTimestamp: 1683326572053,
  };

  const documentInfo2: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'getUpdatedDocument' },
    requestTimestamp: 1683548337342,
  };

  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo1.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      documentInfo: documentInfo1,
      edfiDoc: { inserted: 'yes' },
    };

    // insert the initial version
    const upsertResult = await upsertDocument(upsertRequest, client);
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    const updateRequest: UpdateRequest = {
      ...newUpdateRequest(),
      documentUuid: upsertResult.newDocumentUuid,
      meadowlarkId,
      documentInfo: documentInfo2,
      edfiDoc: { natural: 'keyUpdated' },
    };
    const updateResult = await updateDocumentByDocumentUuid(updateRequest, client);
    if (updateResult.response !== 'UPDATE_SUCCESS') throw new Error();
    getResult = await getDocumentByDocumentUuid(
      { ...newGetRequest(), documentUuid: upsertResult.newDocumentUuid, resourceInfo },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return the updated document', async () => {
    expect(getResult.response).toBe('GET_SUCCESS');
    expect(getResult.edfiDoc.natural).toBe('keyUpdated');
  });

  it('should return the updated lastmodifiedDate', async () => {
    expect(getResult.response).toBe('GET_SUCCESS');
    expect(getResult.lastModifiedDate).toBe(1683548337342);
  });
});
