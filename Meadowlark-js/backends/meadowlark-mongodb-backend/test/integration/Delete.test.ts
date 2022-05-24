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
  DeleteRequest,
  DocumentReference,
  UpsertRequest,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
} from '@edfi/meadowlark-core';
import { Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getCollection, getNewClient } from '../../src/repository/Db';
import { deleteDocumentById } from '../../src/repository/Delete';
import { upsertDocument } from '../../src/repository/Upsert';

jest.setTimeout(40000);

const newUpsertRequest = (): UpsertRequest => ({
  id: '',
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validate: false,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

const newDeleteRequest = (): DeleteRequest => ({
  id: '',
  resourceInfo: NoResourceInfo,
  validate: false,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

describe('given the delete of a non-existent document', () => {
  let client;
  let deleteResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'delete1' }],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    deleteResult = await deleteDocumentById({ ...newDeleteRequest(), id, resourceInfo, validate: false }, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should return delete failure', async () => {
    expect(deleteResult.response).toBe('DELETE_FAILURE_NOT_EXISTS');
  });
});

describe('given the delete of an existing document', () => {
  let client;
  let deleteResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'delete2' }],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = { ...newUpsertRequest(), id, documentInfo, edfiDoc: { natural: 'key' } };

    // insert the initial version
    await upsertDocument(upsertRequest, client);

    deleteResult = await deleteDocumentById({ ...newDeleteRequest(), id, resourceInfo }, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should return delete success', async () => {
    expect(deleteResult.response).toBe('DELETE_SUCCESS');
  });

  it('should have deleted the document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id });
    expect(result).toBeNull();
  });
});

describe('given an delete of a document referenced by an existing document with validation on', () => {
  let client;
  let deleteResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'delete5' }],
  };
  const referencedDocumentId = documentIdForDocumentInfo(referencedResourceInfo, referencedDocumentInfo);

  const validReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    resourceVersion: referencedResourceInfo.resourceVersion,
    isAssignableFrom: false,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'delete6' }],
    documentReferences: [validReference],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    await upsertDocument({ ...newUpsertRequest(), id: referencedDocumentId, documentInfo: referencedDocumentInfo }, client);

    // The referencing document that should cause the delete to fail
    await upsertDocument(
      { ...newUpsertRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );

    deleteResult = await deleteDocumentById(
      { ...newDeleteRequest(), id: referencedDocumentId, resourceInfo: referencedResourceInfo, validate: true },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned delete failure due to existing reference', async () => {
    expect(deleteResult.response).toBe('DELETE_FAILURE_REFERENCE');
  });

  it('should still have the referenced document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id: referencedDocumentId });
    expect(result.documentIdentity[0].value).toBe('delete5');
  });
});

describe('given an delete of a document referenced by an existing document with validation off', () => {
  let client;
  let deleteResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'delete5' }],
  };
  const referencedDocumentId = documentIdForDocumentInfo(referencedResourceInfo, referencedDocumentInfo);

  const validReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    resourceVersion: referencedResourceInfo.resourceVersion,
    isAssignableFrom: false,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'delete6' }],
    documentReferences: [validReference],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    await upsertDocument({ ...newUpsertRequest(), id: referencedDocumentId, documentInfo: referencedDocumentInfo }, client);

    // The referencing document that should cause the delete to fail
    await upsertDocument(
      { ...newUpsertRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );

    deleteResult = await deleteDocumentById(
      { ...newDeleteRequest(), id: referencedDocumentId, resourceInfo: referencedResourceInfo, validate: false },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned delete success', async () => {
    expect(deleteResult.response).toBe('DELETE_SUCCESS');
  });

  it('should not have the referenced document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id: referencedDocumentId });
    expect(result).toBeNull();
  });
});
