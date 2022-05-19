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
  UpsertRequest,
  DocumentReference,
} from '@edfi/meadowlark-core';
import { Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getCollection, getNewClient } from '../../src/repository/Db';
import { upsertDocument } from '../../src/repository/Upsert';

jest.setTimeout(40000);

const newUpsertRequest = (): UpsertRequest => ({
  id: '',
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validate: false,
  security: { ...newSecurity(), isOwnershipEnabled: false },
  traceId: 'traceId',
});

describe('given the upsert of a new document', () => {
  let client;
  let upsertResult;

  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'upsert1' }],
  };
  const id = documentIdForDocumentInfo(documentInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    upsertResult = await upsertDocument(
      { ...newUpsertRequest(), id, documentInfo, edfiDoc: { call: 'one' }, validate: false },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should exist in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id });
    expect(result.resourceName).toBe('School');
    expect(result.edfiDoc.call).toBe('one');
  });

  it('should return insert success', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });
});

describe('given the upsert of an existing document twice', () => {
  let client;
  let upsertResult1;
  let upsertResult2;
  let upsertResult3;

  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'upsert2' }],
  };
  const id = documentIdForDocumentInfo(documentInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = { ...newUpsertRequest(), id, documentInfo, edfiDoc: { natural: 'key' } };

    upsertResult1 = await upsertDocument(upsertRequest, client);
    upsertResult2 = await upsertDocument(upsertRequest, client);
    upsertResult3 = await upsertDocument(upsertRequest, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should return insert success on 1st upsert', async () => {
    expect(upsertResult1.response).toBe('INSERT_SUCCESS');
  });

  it('should return update success on 2nd upsert', async () => {
    expect(upsertResult2.response).toBe('UPDATE_SUCCESS');
  });

  it('should return update success on 3rd upsert', async () => {
    expect(upsertResult3.response).toBe('UPDATE_SUCCESS');
  });
});

describe('given an upsert of an existing document that changes the edfiDoc', () => {
  let client;

  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'upsert3' }],
  };
  const id = documentIdForDocumentInfo(documentInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = { ...newUpsertRequest(), id, documentInfo };

    await upsertDocument({ ...upsertRequest, edfiDoc: { call: 'one' } }, client);
    await upsertDocument({ ...upsertRequest, edfiDoc: { call: 'two' } }, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have the change in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id });
    expect(result.edfiDoc.call).toBe('two');
  });
});

describe('given an upsert of a new document that references a non-existent document with validation off', () => {
  let client;
  let upsertResult;

  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'AcademicWeek',
    documentIdentity: [{ name: 'natural', value: 'upsert4' }],
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
  documentWithReferencesInfo.documentReferences = [invalidReference];

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // The new document with an invalid reference
    upsertResult = await upsertDocument(
      { ...newUpsertRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: false },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned insert success for the document with invalid reference but validation off', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have inserted the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id: documentWithReferencesId });
    expect(result.documentIdentity[0].value).toBe('upsert4');
  });
});

describe('given an upsert of a new document that references an existing document with validation on', () => {
  let client;
  let upsertResult;

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'upsert5' }],
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
    documentIdentity: [{ name: 'natural', value: 'upsert6' }],
    documentReferences: [validReference],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    //  The document that will be referenced
    await upsertDocument({ ...newUpsertRequest(), id: referencedDocumentId, documentInfo: referencedDocumentInfo }, client);

    // The new document with a valid reference
    upsertResult = await upsertDocument(
      { ...newUpsertRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned insert success for the document with a valid reference', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have inserted the document with a valid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id: documentWithReferencesId });
    expect(result.documentIdentity[0].value).toBe('upsert6');
  });
});

describe('given an upsert of a new document with one existing and one non-existent reference with validation on', () => {
  let client;
  let upsertResult;

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'upsert7' }],
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
    documentIdentity: [{ name: 'natural', value: 'upsert8' }],
    documentReferences: [validReference, invalidReference],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    //  The document that will be referenced
    await upsertDocument({ ...newUpsertRequest(), id: referencedDocumentId, documentInfo: referencedDocumentInfo }, client);

    // The new document with both valid and invalid references
    upsertResult = await upsertDocument(
      { ...newUpsertRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned a failure to insert the document with an invalid reference', async () => {
    expect(upsertResult.response).toBe('INSERT_FAILURE_REFERENCE');
    expect(upsertResult.failureMessage).toMatchInlineSnapshot(
      `"Reference validation failed: Resource School is missing identity [{\\"name\\":\\"natural\\",\\"value\\":\\"not a valid reference\\"}]"`,
    );
  });

  it('should not have inserted the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id: documentWithReferencesId });
    expect(result).toBe(null);
  });
});

// ----- Update mode

describe('given an update of a document that references a non-existent document with validation off', () => {
  let client;
  let upsertResult;

  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'AcademicWeek',
    documentIdentity: [{ name: 'natural', value: 'upsert4' }],
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
      { ...newUpsertRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: false },
      client,
    );

    // Update the document with an invalid reference
    documentWithReferencesInfo.documentReferences = [invalidReference];
    upsertResult = await upsertDocument(
      { ...newUpsertRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: false },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned update success for the document with invalid reference but validation off', async () => {
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id: documentWithReferencesId });
    expect(result.documentIdentity[0].value).toBe('upsert4');
    expect(result.outRefs).toMatchInlineSnapshot(`
      Array [
        "c4bf52a9250e88d5b176e615faf9d8d2992830f51b9cae7a6ef8a91f",
      ]
    `);
  });
});

describe('given an update of a document that references an existing document with validation on', () => {
  let client;
  let upsertResult;

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'upsert5' }],
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
    documentIdentity: [{ name: 'natural', value: 'upsert6' }],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    await upsertDocument({ ...newUpsertRequest(), id: referencedDocumentId, documentInfo: referencedDocumentInfo }, client);

    // The original document with no reference
    await upsertDocument(
      { ...newUpsertRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );

    // The updated document with a valid reference
    documentWithReferencesInfo.documentReferences = [validReference];
    upsertResult = await upsertDocument(
      { ...newUpsertRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned update success for the document with a valid reference', async () => {
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id: documentWithReferencesId });
    expect(result.documentIdentity[0].value).toBe('upsert6');
    expect(result.outRefs).toMatchInlineSnapshot(`
      Array [
        "a70c8f13d06baff1f0b5e4ae5fdfc5b679f2e90c2863f4c923bab62a",
      ]
    `);
  });
});

describe('given an update of a document with one existing and one non-existent reference with validation on', () => {
  let client;
  let upsertResult;

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'upsert7' }],
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
    documentIdentity: [{ name: 'natural', value: 'upsert8' }],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    //  The document that will be referenced
    await upsertDocument({ ...newUpsertRequest(), id: referencedDocumentId, documentInfo: referencedDocumentInfo }, client);

    // The original document with no references
    await upsertDocument(
      { ...newUpsertRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );

    // The updated document with both valid and invalid references
    documentWithReferencesInfo.documentReferences = [validReference, invalidReference];
    upsertResult = await upsertDocument(
      { ...newUpsertRequest(), id: documentWithReferencesId, documentInfo: documentWithReferencesInfo, validate: true },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned a failure to insert the document with an invalid reference', async () => {
    expect(upsertResult.response).toBe('UPDATE_FAILURE_REFERENCE');
    expect(upsertResult.failureMessage).toMatchInlineSnapshot(
      `"Reference validation failed: Resource School is missing identity [{\\"name\\":\\"natural\\",\\"value\\":\\"not a valid reference\\"}]"`,
    );
  });

  it('should not have updated the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id: documentWithReferencesId });
    expect(result.outRefs).toHaveLength(0);
  });
});
