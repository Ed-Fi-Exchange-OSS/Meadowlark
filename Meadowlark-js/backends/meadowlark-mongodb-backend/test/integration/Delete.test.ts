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
  newSuperclassInfo,
  SuperclassInfo,
} from '@edfi/meadowlark-core';
import { Collection, MongoClient } from 'mongodb';
import crypto from 'node:crypto';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getDocumentCollection, getNewClient } from '../../src/repository/Db';
import { deleteDocumentById } from '../../src/repository/Delete';
import { upsertDocument } from '../../src/repository/Upsert';
import { setupConfigForIntegration } from './Config';

jest.setTimeout(40000);
const documentUuid = '3518d452-a7b7-4f1c-aa91-26ccc48cf4b8';
const documentUuidBackup = '4518d452-a7b7-4f1c-aa91-26ccc48cf4b8';
const newUpsertRequest = (): UpsertRequest => ({
  meadowlarkId: '',
  documentUuid,
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validate: false,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

const newDeleteRequest = (): DeleteRequest => ({
  meadowlarkId: '',
  documentUuid,
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

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    deleteResult = await deleteDocumentById({ ...newDeleteRequest(), documentUuid, resourceInfo, validate: false }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
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
    documentIdentity: { natural: 'delete2' },
  };

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = { ...newUpsertRequest(), documentUuid, documentInfo, edfiDoc: { natural: 'key' } };

    // insert the initial version
    await upsertDocument(upsertRequest, client);

    deleteResult = await deleteDocumentById({ ...newDeleteRequest(), documentUuid, resourceInfo }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return delete success', async () => {
    expect(deleteResult.response).toBe('DELETE_SUCCESS');
  });

  it('should have deleted the document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ documentUuid });
    expect(result).toBeNull();
  });
});

describe('given the delete of a document referenced by an existing document with validation on', () => {
  let client;
  let deleteResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'delete5' },
  };
  const referencedDocumentId = documentIdForDocumentInfo(referencedResourceInfo, referencedDocumentInfo);

  const validReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'delete6' },
    documentReferences: [validReference],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    await upsertDocument(
      { ...newUpsertRequest(), documentUuid, meadowlarkId: referencedDocumentId, documentInfo: referencedDocumentInfo },
      client,
    );

    // The referencing document that should cause the delete to fail
    await upsertDocument(
      {
        ...newUpsertRequest(),
        documentUuid: documentUuidBackup,
        meadowlarkId: documentWithReferencesId,
        documentInfo: documentWithReferencesInfo,
        validate: true,
      },
      client,
    );

    deleteResult = await deleteDocumentById(
      { ...newDeleteRequest(), documentUuid, resourceInfo: referencedResourceInfo, validate: true },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned delete failure due to existing reference', async () => {
    expect(deleteResult.response).toBe('DELETE_FAILURE_REFERENCE');
  });

  it('should still have the referenced document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: referencedDocumentId });
    expect(result.documentIdentity.natural).toBe('delete5');
  });
});

describe('given an delete of a document with an outbound reference only, with validation on', () => {
  let client;
  let deleteResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'delete15' },
  };
  const referencedDocumentId = documentIdForDocumentInfo(referencedResourceInfo, referencedDocumentInfo);

  const validReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'delete16' },
    documentReferences: [validReference],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    await upsertDocument(
      { ...newUpsertRequest(), documentUuid, meadowlarkId: referencedDocumentId, documentInfo: referencedDocumentInfo },
      client,
    );

    // The referencing document that will be deleted
    await upsertDocument(
      {
        ...newUpsertRequest(),
        documentUuid: documentUuidBackup,
        meadowlarkId: documentWithReferencesId,
        documentInfo: documentWithReferencesInfo,
        validate: true,
      },
      client,
    );

    deleteResult = await deleteDocumentById(
      {
        ...newDeleteRequest(),
        documentUuid: documentUuidBackup,
        resourceInfo: documentWithReferencesResourceInfo,
        validate: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return delete success', async () => {
    expect(deleteResult.response).toBe('DELETE_SUCCESS');
  });

  it('should have deleted the document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result).toBeNull();
  });
});

describe('given the delete of a document referenced by an existing document with validation off', () => {
  let client;
  let deleteResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'delete5' },
  };
  const referencedDocumentId = documentIdForDocumentInfo(referencedResourceInfo, referencedDocumentInfo);

  const validReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'delete6' },
    documentReferences: [validReference],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    await upsertDocument(
      {
        ...newUpsertRequest(),
        documentUuid: documentUuidBackup,
        meadowlarkId: referencedDocumentId,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The referencing document that should cause the delete to fail
    await upsertDocument(
      {
        ...newUpsertRequest(),
        documentUuid,
        meadowlarkId: documentWithReferencesId,
        documentInfo: documentWithReferencesInfo,
        validate: true,
      },
      client,
    );

    deleteResult = await deleteDocumentById(
      { ...newDeleteRequest(), documentUuid: documentUuidBackup, resourceInfo: referencedResourceInfo, validate: false },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned delete success', async () => {
    expect(deleteResult.response).toBe('DELETE_SUCCESS');
  });

  it('should not have the referenced document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: referencedDocumentId });
    expect(result).toBeNull();
  });
});

describe('given the delete of a subclass document referenced by an existing document as a superclass', () => {
  let client;
  let deleteResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
    projectName: 'Ed-Fi',
  };

  const superclassInfo: SuperclassInfo = {
    ...newSuperclassInfo(),
    documentIdentity: { educationOrganizationId: '123' },
    resourceName: 'EducationOrganization',
    projectName: 'Ed-Fi',
  };

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { schoolId: '123' },
    superclassInfo,
  };
  const referencedDocumentId = documentIdForDocumentInfo(referencedResourceInfo, referencedDocumentInfo);

  const referenceAsSuperclass: DocumentReference = {
    projectName: superclassInfo.projectName,
    resourceName: superclassInfo.resourceName,
    documentIdentity: superclassInfo.documentIdentity,
    isDescriptor: false,
  };

  const documentWithReferenceResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferenceDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { week: 'delete6' },
    documentReferences: [referenceAsSuperclass],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(
    documentWithReferenceResourceInfo,
    documentWithReferenceDocumentInfo,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const documentUuidReferenced = crypto.randomUUID();
    const documentUuidDeleteFailed = crypto.randomUUID();
    // The document that will be referenced
    await upsertDocument(
      {
        ...newUpsertRequest(),
        documentUuid: documentUuidReferenced,
        meadowlarkId: referencedDocumentId,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The referencing document that should cause the delete to fail
    await upsertDocument(
      {
        ...newUpsertRequest(),
        documentUuid: documentUuidDeleteFailed,
        meadowlarkId: documentWithReferencesId,
        documentInfo: documentWithReferenceDocumentInfo,
        validate: true,
      },
      client,
    );

    deleteResult = await deleteDocumentById(
      { ...newDeleteRequest(), documentUuid: documentUuidReferenced, resourceInfo: referencedResourceInfo, validate: true },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned delete failure due to existing reference', async () => {
    expect(deleteResult.response).toBe('DELETE_FAILURE_REFERENCE');
  });

  it('should still have the referenced document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: referencedDocumentId });
    expect(result.documentIdentity.schoolId).toBe('123');
  });
});
