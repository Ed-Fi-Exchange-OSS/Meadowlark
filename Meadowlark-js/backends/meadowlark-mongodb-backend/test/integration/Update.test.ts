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
  UpdateRequest,
  DocumentReference,
} from '@edfi/meadowlark-core';
import { Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getCollection, getNewClient } from '../../src/repository/Db';
import { updateDocumentById } from '../../src/repository/Update';
import { upsertDocument } from '../../src/repository/Upsert';

jest.setTimeout(40000);

const newUpdateRequest = (): UpdateRequest => ({
  id: '',
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validate: false,
  security: { ...newSecurity(), isOwnershipEnabled: false },
  traceId: 'traceId',
});

describe('given the update of a non-existent document', () => {
  let client;
  let updateResult;

  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'update1' }],
  };
  const id = documentIdForDocumentInfo(documentInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    updateResult = await updateDocumentById(
      { ...newUpdateRequest(), id, documentInfo, edfiDoc: { call: 'one' }, validate: false },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should not exist in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id });
    expect(result).toBe(null);
  });

  it('should return update failure', async () => {
    expect(updateResult.response).toBe('UPDATE_FAILURE_NOT_EXISTS');
  });
});

describe('given the update of an existing document', () => {
  let client;
  let updateResult;

  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'update2' }],
  };
  const id = documentIdForDocumentInfo(documentInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    const updateRequest: UpdateRequest = { ...newUpdateRequest(), id, documentInfo, edfiDoc: { natural: 'key' } };

    // insert the initial version
    await upsertDocument(updateRequest, client);

    updateResult = await updateDocumentById({ ...updateRequest, edfiDoc: { changeToDoc: true } }, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should return update success', async () => {
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id });
    expect(result.documentIdentity[0].value).toBe('update2');
    expect(result.edfiDoc.changeToDoc).toBe(true);
  });
});

describe('given an update of a document that references a non-existent document with validation off', () => {
  let client;
  let updateResult;

  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'AcademicWeek',
    documentIdentity: [{ name: 'natural', value: 'update4' }],
  };

  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesInfo);

  const invalidReference: DocumentReference = {
    projectName: documentWithReferencesInfo.projectName,
    resourceName: documentWithReferencesInfo.resourceName,
    resourceVersion: documentWithReferencesInfo.resourceVersion,
    isAssignableFrom: false,
    documentIdentity: [{ name: 'natural', value: 'not a valid reference' }],
    isDescriptor: false,
  };

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // Insert the original document with no reference
    await upsertDocument(
      { ...newUpdateRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: false },
      client,
    );

    // Update the document with an invalid reference
    documentWithReferencesInfo.documentReferences = [invalidReference];
    updateResult = await updateDocumentById(
      { ...newUpdateRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: false },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned update success for the document with invalid reference but validation off', async () => {
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id: documentWithReferencesId });
    expect(result.documentIdentity[0].value).toBe('update4');
    expect(result.outRefs).toMatchInlineSnapshot(`
      Array [
        "c4bf52a9250e88d5b176e615faf9d8d2992830f51b9cae7a6ef8a91f",
      ]
    `);
  });
});

describe('given an update of a document that references an existing document with validation on', () => {
  let client;
  let updateResult;

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'update5' }],
  };
  const referencedDocumentId = documentIdForDocumentInfo(referencedDocumentInfo);

  const validReference: DocumentReference = {
    projectName: referencedDocumentInfo.projectName,
    resourceName: referencedDocumentInfo.resourceName,
    resourceVersion: referencedDocumentInfo.resourceVersion,
    isAssignableFrom: false,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'AcademicWeek',
    documentIdentity: [{ name: 'natural', value: 'update6' }],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    await upsertDocument({ ...newUpdateRequest(), id: referencedDocumentId, documentInfo: referencedDocumentInfo }, client);

    // The original document with no reference
    await upsertDocument(
      { ...newUpdateRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );

    // The updated document with a valid reference
    documentWithReferencesInfo.documentReferences = [validReference];
    updateResult = await updateDocumentById(
      { ...newUpdateRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned update success for the document with a valid reference', async () => {
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id: documentWithReferencesId });
    expect(result.documentIdentity[0].value).toBe('update6');
    expect(result.outRefs).toMatchInlineSnapshot(`
      Array [
        "68234f9521018cb780e9d4904198618d3b12b44f83e488cc1606e29a",
      ]
    `);
  });
});

describe('given an update of a document with one existing and one non-existent reference with validation on', () => {
  let client;
  let updateResult;

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'update7' }],
  };
  const referencedDocumentId = documentIdForDocumentInfo(referencedDocumentInfo);

  const validReference: DocumentReference = {
    projectName: referencedDocumentInfo.projectName,
    resourceName: referencedDocumentInfo.resourceName,
    resourceVersion: referencedDocumentInfo.resourceVersion,
    isAssignableFrom: false,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const invalidReference: DocumentReference = {
    projectName: referencedDocumentInfo.projectName,
    resourceName: referencedDocumentInfo.resourceName,
    resourceVersion: referencedDocumentInfo.resourceVersion,
    isAssignableFrom: false,
    documentIdentity: [{ name: 'natural', value: 'not a valid reference' }],
    isDescriptor: false,
  };

  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'AcademicWeek',
    documentIdentity: [{ name: 'natural', value: 'update8' }],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    //  The document that will be referenced
    await upsertDocument({ ...newUpdateRequest(), id: referencedDocumentId, documentInfo: referencedDocumentInfo }, client);

    // The original document with no references
    await upsertDocument(
      { ...newUpdateRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );

    // The updated document with both valid and invalid references
    documentWithReferencesInfo.documentReferences = [validReference, invalidReference];
    updateResult = await updateDocumentById(
      { ...newUpdateRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned a failure to insert the document with an invalid reference', async () => {
    expect(updateResult.response).toBe('UPDATE_FAILURE_REFERENCE');
    expect(updateResult.failureMessage).toMatchInlineSnapshot(
      `"Reference validation failed: Resource School is missing identity [{\\"name\\":\\"natural\\",\\"value\\":\\"not a valid reference\\"}]"`,
    );
  });

  it('should not have updated the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id: documentWithReferencesId });
    expect(result.outRefs).toHaveLength(0);
  });
});
