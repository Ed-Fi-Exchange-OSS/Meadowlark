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
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  newSuperclassInfo,
  SuperclassInfo,
} from '@edfi/meadowlark-core';
import { Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getCollection, getNewClient } from '../../src/repository/Db';
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

describe('given the upsert of a new document', () => {
  let client;
  let upsertResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert1' },
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    upsertResult = await upsertDocument(
      { ...newUpsertRequest(), id, resourceInfo, documentInfo, edfiDoc: { call: 'one' }, validate: false },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should exist in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ _id: id });
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

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert2' },
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = {
      ...newUpsertRequest(),
      id,
      resourceInfo,
      documentInfo,
      edfiDoc: { natural: 'key' },
    };

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

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert3' },
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = { ...newUpsertRequest(), id, resourceInfo, documentInfo };

    await upsertDocument({ ...upsertRequest, edfiDoc: { call: 'one' } }, client);
    await upsertDocument({ ...upsertRequest, edfiDoc: { call: 'two' } }, client);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have the change in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ _id: id });
    expect(result.edfiDoc.call).toBe('two');
  });
});

describe('given an upsert of a new document that references a non-existent document with validation off', () => {
  let client;
  let upsertResult;

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert4' },
  };

  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  const invalidReference: DocumentReference = {
    projectName: documentWithReferencesResourceInfo.projectName,
    resourceName: documentWithReferencesResourceInfo.resourceName,
    documentIdentity: { natural: 'not a valid reference' },
    isDescriptor: false,
  };
  documentWithReferencesInfo.documentReferences = [invalidReference];

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // The new document with an invalid reference
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: false,
      },
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
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.documentIdentity.natural).toBe('upsert4');
  });
});

describe('given an upsert of a new document that references an existing document with validation on', () => {
  let client;
  let upsertResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert5' },
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
    documentIdentity: { natural: 'upsert6' },
    documentReferences: [validReference],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    //  The document that will be referenced
    await upsertDocument(
      {
        ...newUpsertRequest(),
        id: referencedDocumentId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The new document with a valid reference
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: true,
      },
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
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.documentIdentity.natural).toBe('upsert6');
  });
});

describe('given an upsert of a new document with one existing and one non-existent reference with validation on', () => {
  let client;
  let upsertResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert7' },
  };
  const referencedDocumentId = documentIdForDocumentInfo(referencedResourceInfo, referencedDocumentInfo);

  const validReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const invalidReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    documentIdentity: { natural: 'not a valid reference' },
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert8' },
    documentReferences: [validReference, invalidReference],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    //  The document that will be referenced
    await upsertDocument(
      {
        ...newUpsertRequest(),
        id: referencedDocumentId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The new document with both valid and invalid references
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: true,
      },
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
      `"Reference validation failed: Resource School is missing identity {\\"natural\\":\\"not a valid reference\\"}"`,
    );
  });

  it('should not have inserted the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result).toBe(null);
  });
});

describe('given an upsert of a subclass document referenced by an existing document as a superclass', () => {
  let client;
  let upsertResult;

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
    documentIdentity: { week: 'update6' },
    documentReferences: [referenceAsSuperclass],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(
    documentWithReferenceResourceInfo,
    documentWithReferenceDocumentInfo,
  );

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    //  The document that will be referenced
    await upsertDocument(
      {
        ...newUpsertRequest(),
        id: referencedDocumentId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The new upserted document with reference as superclass
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferenceResourceInfo,
        documentInfo: documentWithReferenceDocumentInfo,
        validate: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should return success for document insert with a valid reference to superclass', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have a valid reference to superclass in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.outRefs).toMatchInlineSnapshot(`
      Array [
        "BS3Ub80H5FHOD2j0qzdjhJXZsGSfcZtPWaiepA",
      ]
    `);
  });
});

// ----- Update mode

describe('given an update of a document that references a non-existent document with validation off', () => {
  let client;
  let upsertResult;

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert4' },
  };

  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  const invalidReference: DocumentReference = {
    projectName: documentWithReferencesResourceInfo.projectName,
    resourceName: documentWithReferencesResourceInfo.resourceName,
    documentIdentity: { natural: 'not a valid reference' },
    isDescriptor: false,
  };

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // Insert the original document with no reference
    await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: false,
      },
      client,
    );

    // Update the document with an invalid reference
    documentWithReferencesInfo.documentReferences = [invalidReference];
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: false,
      },
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
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.documentIdentity.natural).toBe('upsert4');
    expect(result.outRefs).toMatchInlineSnapshot(`
      Array [
        "QtykK4uDYZK7VOChNxRsMDtOcAu6a0oe9ozl2Q",
      ]
    `);
  });
});

describe('given an update of a document that references an existing document with validation on', () => {
  let client;
  let upsertResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert5' },
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
    documentIdentity: { natural: 'upsert6' },
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    // The document that will be referenced
    await upsertDocument(
      {
        ...newUpsertRequest(),
        id: referencedDocumentId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The original document with no reference
    await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: true,
      },
      client,
    );

    // The updated document with a valid reference
    documentWithReferencesInfo.documentReferences = [validReference];
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: true,
      },
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
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.documentIdentity.natural).toBe('upsert6');
    expect(result.outRefs).toMatchInlineSnapshot(`
      Array [
        "Qw5FvPdKxAXWnGghUWv5LKuA2cXaJPWJGJRDBQ",
      ]
    `);
  });
});

describe('given an update of a document with one existing and one non-existent reference with validation on', () => {
  let client;
  let upsertResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert7' },
  };
  const referencedDocumentId = documentIdForDocumentInfo(referencedResourceInfo, referencedDocumentInfo);

  const validReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    documentIdentity: referencedDocumentInfo.documentIdentity,
    isDescriptor: false,
  };

  const invalidReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    documentIdentity: { natural: 'not a valid reference' },
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert8' },
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    //  The document that will be referenced
    await upsertDocument(
      {
        ...newUpsertRequest(),
        id: referencedDocumentId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The original document with no references
    await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: true,
      },
      client,
    );

    // The updated document with both valid and invalid references
    documentWithReferencesInfo.documentReferences = [validReference, invalidReference];
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: true,
      },
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
      `"Reference validation failed: Resource School is missing identity {\\"natural\\":\\"not a valid reference\\"}"`,
    );
  });

  it('should not have updated the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.outRefs).toHaveLength(0);
  });
});

describe('given an update of a subclass document referenced by an existing document as a superclass', () => {
  let client;
  let upsertResult;

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
    documentIdentity: { week: 'update6' },
  };
  const documentWithReferencesId = documentIdForDocumentInfo(
    documentWithReferenceResourceInfo,
    documentWithReferenceDocumentInfo,
  );

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    //  The document that will be referenced
    await upsertDocument(
      {
        ...newUpsertRequest(),
        id: referencedDocumentId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The original document with no reference
    await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferenceResourceInfo,
        documentInfo: documentWithReferenceDocumentInfo,
        validate: true,
      },
      client,
    );

    // The updated document with reference as superclass
    documentWithReferenceDocumentInfo.documentReferences = [referenceAsSuperclass];
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferenceResourceInfo,
        documentInfo: documentWithReferenceDocumentInfo,
        validate: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should return success for the document with a valid reference to superclass', async () => {
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference to superclass in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.outRefs).toMatchInlineSnapshot(`
      Array [
        "BS3Ub80H5FHOD2j0qzdjhJXZsGSfcZtPWaiepA",
      ]
    `);
  });
});
