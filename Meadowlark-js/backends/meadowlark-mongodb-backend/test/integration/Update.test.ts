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
  UpdateRequest,
  DocumentReference,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  newSuperclassInfo,
  SuperclassInfo,
  TraceId,
  MeadowlarkId,
  UpsertRequest,
  UpdateResult,
  DocumentUuid,
  UpsertResult,
} from '@edfi/meadowlark-core';
import { Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getDocumentCollection, getNewClient } from '../../src/repository/Db';
import { updateDocumentById } from '../../src/repository/Update';
import { upsertDocument } from '../../src/repository/Upsert';
import { setupConfigForIntegration } from './Config';

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

const newUpsertRequest = (): UpsertRequest => ({
  meadowlarkId: '' as MeadowlarkId,
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

describe('given the update of a non-existent document', () => {
  let client;
  let updateResult: UpdateResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'update1' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    updateResult = await updateDocumentById(
      {
        ...newUpdateRequest(),
        meadowlarkId,
        documentUuid: '123' as DocumentUuid,
        resourceInfo,
        documentInfo,
        edfiDoc: { call: 'one' },
        validateDocumentReferencesExist: false,
      },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should not exist in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ documentUuid: '123' as DocumentUuid });
    expect(result).toBe(null);
  });

  it('should return update failure', async () => {
    expect(updateResult.response).toBe('UPDATE_FAILURE_NOT_EXISTS');
  });
});

describe('given the update of an existing document', () => {
  let client;
  let upsertResult: UpsertResult;
  let updateResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'update2' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo,
      edfiDoc: { natural: 'key' },
    };

    // insert the initial version
    upsertResult = await upsertDocument(upsertRequest, client);
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    const updateRequest: UpdateRequest = {
      ...newUpdateRequest(),
      meadowlarkId,
      documentUuid: upsertResult.newDocumentUuid,
      resourceInfo,
      documentInfo,
      edfiDoc: { natural: 'key' },
    };
    updateResult = await updateDocumentById({ ...updateRequest, edfiDoc: { changeToDoc: true } }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return update success', async () => {
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result.documentIdentity.natural).toBe('update2');
    expect(result.edfiDoc.changeToDoc).toBe(true);
  });
});

describe('given an update of a document that references a non-existent document with validation off', () => {
  let client;
  let upsertResult: UpsertResult;
  let updateResult;

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'update4' },
  };

  const documentWithReferencesId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  const invalidReference: DocumentReference = {
    projectName: documentWithReferencesResourceInfo.projectName,
    resourceName: documentWithReferencesResourceInfo.resourceName,
    documentIdentity: { natural: 'not a valid reference' },
    isDescriptor: false,
  };

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // Insert the original document with no reference
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: false,
      },
      client,
    );

    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    // Update the document with an invalid reference
    documentWithReferencesInfo.documentReferences = [invalidReference];
    updateResult = await updateDocumentById(
      {
        ...newUpdateRequest(),
        documentUuid: upsertResult.newDocumentUuid,
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: false,
      },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned update success for the document with invalid reference but validation off', async () => {
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.documentIdentity.natural).toBe('update4');
    expect(result.outboundRefs).toMatchInlineSnapshot(`
      [
        "QtykK4uDYZK7VOChNxRsMDtOcAu6a0oe9ozl2Q",
      ]
    `);
  });
});

describe('given an update of a document that references an existing document with validation on', () => {
  let client;
  let upsertResult: UpsertResult;
  let updateResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'update5' },
  };
  const referencedDocumentId = meadowlarkIdForDocumentIdentity(
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
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'update6' },
  };
  const documentWithReferencesId = meadowlarkIdForDocumentIdentity(
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
        meadowlarkId: referencedDocumentId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The original document with no reference
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    // The updated document with a valid reference
    documentWithReferencesInfo.documentReferences = [validReference];
    updateResult = await updateDocumentById(
      {
        ...newUpdateRequest(),
        meadowlarkId: documentWithReferencesId,
        documentUuid: upsertResult.newDocumentUuid,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned update success for the document with a valid reference', async () => {
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.documentIdentity.natural).toBe('update6');
    expect(result.outboundRefs).toMatchInlineSnapshot(`
      [
        "Qw5FvPdKxAXWnGghsMh3I61yLFfls4Q949Fk2w",
      ]
    `);
  });
});

describe('given an update of a document with one existing and one non-existent reference with validation on', () => {
  let client;
  let upsertResult: UpsertResult;
  let updateResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'update7' },
  };
  const referencedDocumentId = meadowlarkIdForDocumentIdentity(
    referencedResourceInfo,
    referencedDocumentInfo.documentIdentity,
  );

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
    documentIdentity: { natural: 'update8' },
  };
  const documentWithReferencesId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    //  The document that will be referenced
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: referencedDocumentId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The original document with no references
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    // The updated document with both valid and invalid references
    documentWithReferencesInfo.documentReferences = [validReference, invalidReference];
    updateResult = await updateDocumentById(
      {
        ...newUpdateRequest(),
        documentUuid: upsertResult.newDocumentUuid,
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned a failure to insert the document with an invalid reference', async () => {
    expect(updateResult.response).toBe('UPDATE_FAILURE_REFERENCE');
    expect(updateResult.failureMessage).toMatchInlineSnapshot(`
      {
        "failures": [
          {
            "identity": {
              "natural": "not a valid reference",
            },
            "resourceName": "School",
          },
        ],
        "message": "Reference validation failed",
      }
    `);
  });

  it('should not have updated the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.outboundRefs).toHaveLength(0);
  });
});

describe('given an update of a subclass document referenced by an existing document as a superclass', () => {
  let client;
  let upsertResult: UpsertResult;
  let updateResult;

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
  const referencedDocumentId = meadowlarkIdForDocumentIdentity(
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
    resourceName: 'AcademicWeek',
  };
  const documentWithReferenceDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { week: 'update6' },
  };
  const documentWithReferencesId = meadowlarkIdForDocumentIdentity(
    documentWithReferenceResourceInfo,
    documentWithReferenceDocumentInfo.documentIdentity,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    //  The document that will be referenced
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: referencedDocumentId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The original document with no reference
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferenceResourceInfo,
        documentInfo: documentWithReferenceDocumentInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    // The updated document with reference as superclass
    documentWithReferenceDocumentInfo.documentReferences = [referenceAsSuperclass];
    updateResult = await updateDocumentById(
      {
        ...newUpdateRequest(),
        documentUuid: upsertResult.newDocumentUuid,
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferenceResourceInfo,
        documentInfo: documentWithReferenceDocumentInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return success for the document with a valid reference to superclass', async () => {
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference to superclass in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.outboundRefs).toMatchInlineSnapshot(`
      [
        "BS3Ub80H5FHOD2j0qzdjhJXZsGSfcZtPWaiepA",
      ]
    `);
  });
});

describe('given the update of an existing document changing meadowlarkId with allowIdentityUpdates false,', () => {
  let client;
  let upsertResult: UpsertResult;
  let updateResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
    allowIdentityUpdates: false,
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'update 2' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo,
      edfiDoc: { natural: 'key' },
    };
    const documentInfoUpdated: DocumentInfo = {
      ...newDocumentInfo(),
      documentIdentity: { natural: 'updated identity' },
    };
    const meadowlarkIdUpdated = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfoUpdated.documentIdentity);

    // insert the initial version
    upsertResult = await upsertDocument(upsertRequest, client);
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    const updateRequest: UpdateRequest = {
      ...newUpdateRequest(),
      meadowlarkId: meadowlarkIdUpdated,
      documentUuid: upsertResult.newDocumentUuid,
      resourceInfo,
      documentInfo: documentInfoUpdated,
      edfiDoc: { natural: 'key' },
    };
    // change document identity
    updateResult = await updateDocumentById({ ...updateRequest, edfiDoc: { changeToDoc: true } }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return update error', async () => {
    expect(updateResult.response).toBe('UPDATE_FAILURE_IMMUTABLE_IDENTITY');
  });
});

describe('given the update of an existing document changing meadowlarkId with allowIdentityUpdates true,', () => {
  let client;
  let upsertResult: UpsertResult;
  let updateResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
    allowIdentityUpdates: true,
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'updated identity' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo,
      edfiDoc: { natural: 'key' },
    };
    const documentInfoUpdated: DocumentInfo = {
      ...newDocumentInfo(),
      documentIdentity: { natural: 'update 2' },
    };
    const meadowlarkIdUpdated = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfoUpdated.documentIdentity);

    // insert the initial version
    upsertResult = await upsertDocument(upsertRequest, client);
    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();

    const updateRequest: UpdateRequest = {
      ...newUpdateRequest(),
      meadowlarkId: meadowlarkIdUpdated,
      documentUuid: upsertResult.newDocumentUuid,
      resourceInfo,
      documentInfo: documentInfoUpdated,
      edfiDoc: { natural: 'key' },
    };
    // change document identity
    updateResult = await updateDocumentById({ ...updateRequest, edfiDoc: { changeToDoc: true } }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return update success', async () => {
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });
});
