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
  DeleteRequest,
  DocumentReference,
  UpsertRequest,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  newSuperclassInfo,
  SuperclassInfo,
  DocumentUuid,
  MeadowlarkId,
  TraceId,
  UpsertResult,
  MetaEdResourceName,
  DocumentObjectKey,
  MetaEdProjectName,
} from '@edfi/meadowlark-core';
import { Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getDocumentCollection, getNewClient } from '../../src/repository/Db';
import { deleteDocumentByDocumentUuid } from '../../src/repository/Delete';
import { upsertDocument } from '../../src/repository/Upsert';
import { setupConfigForIntegration } from './Config';

const newUpsertRequest = (): UpsertRequest => ({
  meadowlarkId: '' as MeadowlarkId,
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

const newDeleteRequest = (): DeleteRequest => ({
  documentUuid: '' as DocumentUuid,
  resourceInfo: NoResourceInfo,
  validateNoReferencesToDocument: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

describe('given the delete of a non-existent document', () => {
  let client;
  let deleteResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School' as MetaEdResourceName,
  };

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    deleteResult = await deleteDocumentByDocumentUuid(
      { ...newDeleteRequest(), documentUuid: '123' as DocumentUuid, resourceInfo, validateNoReferencesToDocument: false },
      client,
    );
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
  let upsertResult: UpsertResult;
  let deleteResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School' as MetaEdResourceName,
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ documentKey: 'natural' as DocumentObjectKey, documentValue: 'delete2' }],
  };

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = {
      ...newUpsertRequest(),
      documentInfo,
      edfiDoc: { natural: 'key' },
    };

    // insert the initial version
    upsertResult = await upsertDocument(upsertRequest, client);
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    deleteResult = await deleteDocumentByDocumentUuid(
      { ...newDeleteRequest(), documentUuid: upsertResult.newDocumentUuid, resourceInfo },
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
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();
    const result: any = await collection.findOne({ documentUuid: upsertResult.newDocumentUuid });
    expect(result).toBeNull();
  });
});

describe('given the delete of a document referenced by an existing document with validation on', () => {
  let client;
  let upsertResult: UpsertResult;
  let deleteResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School' as MetaEdResourceName,
  };

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ documentKey: 'natural' as DocumentObjectKey, documentValue: 'delete5' }],
  };
  const referencedMeadowlarkId = meadowlarkIdForDocumentIdentity(
    referencedResourceInfo,
    referencedDocumentInfo.documentIdentity,
  );

  const validReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek' as MetaEdResourceName,
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ documentKey: 'natural' as DocumentObjectKey, documentValue: 'delete6' }],
    documentReferences: [validReference],
  };
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: referencedMeadowlarkId,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    // The referencing document that should cause the delete to fail
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesMeadowlarkId,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );

    deleteResult = await deleteDocumentByDocumentUuid(
      {
        ...newDeleteRequest(),
        documentUuid: upsertResult.newDocumentUuid,
        resourceInfo: referencedResourceInfo,
        validateNoReferencesToDocument: true,
      },
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
    const result: any = await collection.findOne({ _id: referencedMeadowlarkId });
    expect(result.documentIdentity[0].documentKey).toBe('natural');
    expect(result.documentIdentity[0].documentValue).toBe('delete5');
  });
});

describe('given an delete of a document with an outbound reference only, with validation on', () => {
  let client;
  let upsertResult2: UpsertResult;
  let deleteResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek' as MetaEdResourceName,
  };

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ documentKey: 'natural' as DocumentObjectKey, documentValue: 'delete15' }],
  };
  const referencedMeadowlarkId = meadowlarkIdForDocumentIdentity(
    referencedResourceInfo,
    referencedDocumentInfo.documentIdentity,
  );

  const validReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School' as MetaEdResourceName,
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ documentKey: 'natural' as DocumentObjectKey, documentValue: 'delete16' }],
    documentReferences: [validReference],
  };
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: referencedMeadowlarkId,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The referencing document that will be deleted
    upsertResult2 = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesMeadowlarkId,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
    if (upsertResult2.response !== 'INSERT_SUCCESS') throw new Error();

    deleteResult = await deleteDocumentByDocumentUuid(
      {
        ...newDeleteRequest(),
        documentUuid: upsertResult2.newDocumentUuid,
        resourceInfo: documentWithReferencesResourceInfo,
        validateNoReferencesToDocument: true,
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
    const result: any = await collection.findOne({ _id: documentWithReferencesMeadowlarkId });
    expect(result).toBeNull();
  });
});

describe('given the delete of a document referenced by an existing document with validation off', () => {
  let client;
  let upsertResult: UpsertResult;
  let deleteResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School' as MetaEdResourceName,
  };
  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ documentKey: 'natural' as DocumentObjectKey, documentValue: 'delete5' }],
  };
  const referencedMeadowlarkId = meadowlarkIdForDocumentIdentity(
    referencedResourceInfo,
    referencedDocumentInfo.documentIdentity,
  );

  const validReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek' as MetaEdResourceName,
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ documentKey: 'natural' as DocumentObjectKey, documentValue: 'delete6' }],
    documentReferences: [validReference],
  };
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: referencedMeadowlarkId,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    // The referencing document that should cause the delete to fail
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesMeadowlarkId,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );

    deleteResult = await deleteDocumentByDocumentUuid(
      {
        ...newDeleteRequest(),
        documentUuid: upsertResult.newDocumentUuid,
        resourceInfo: referencedResourceInfo,
        validateNoReferencesToDocument: false,
      },
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
    const result: any = await collection.findOne({ _id: referencedMeadowlarkId });
    expect(result).toBeNull();
  });
});

describe('given the delete of a subclass document referenced by an existing document as a superclass', () => {
  let client;
  let upsertResult: UpsertResult;
  let deleteResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School' as MetaEdResourceName,
    projectName: 'Ed-Fi' as MetaEdProjectName,
  };

  const superclassInfo: SuperclassInfo = {
    ...newSuperclassInfo(),
    documentIdentity: [{ documentKey: 'educationOrganizationId' as DocumentObjectKey, documentValue: '123' }],
    resourceName: 'EducationOrganization' as MetaEdResourceName,
    projectName: 'Ed-Fi' as MetaEdProjectName,
  };

  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ documentKey: 'schoolId' as DocumentObjectKey, documentValue: '123' }],
    superclassInfo,
  };
  const referencedMeadowlarkId = meadowlarkIdForDocumentIdentity(
    referencedResourceInfo,
    referencedDocumentInfo.documentIdentity,
  );

  const referenceAsSuperclass: DocumentReference = {
    projectName: superclassInfo.projectName,
    resourceName: superclassInfo.resourceName,
    documentIdentity: superclassInfo.documentIdentity,
    isDescriptor: false,
  };

  const documentWithReferenceResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek' as MetaEdResourceName,
  };
  const documentWithReferenceDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ documentKey: 'week' as DocumentObjectKey, documentValue: 'delete6' }],
    documentReferences: [referenceAsSuperclass],
  };
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferenceResourceInfo,
    documentWithReferenceDocumentInfo.documentIdentity,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: referencedMeadowlarkId,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The referencing document that should cause the delete to fail
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesMeadowlarkId,
        documentInfo: documentWithReferenceDocumentInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    deleteResult = await deleteDocumentByDocumentUuid(
      {
        ...newDeleteRequest(),
        documentUuid: upsertResult.newDocumentUuid,
        resourceInfo: referencedResourceInfo,
        validateNoReferencesToDocument: true,
      },
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
    const result: any = await collection.findOne({ _id: referencedMeadowlarkId });
    expect(result.documentIdentity[0].documentKey).toBe('schoolId');
    expect(result.documentIdentity[0].documentValue).toBe('123');
  });
});
