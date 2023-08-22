/* eslint-disable no-underscore-dangle */
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
  UpsertRequest,
  DocumentReference,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  newSuperclassInfo,
  SuperclassInfo,
  DocumentIdentity,
  MeadowlarkId,
  TraceId,
  UpsertResult,
} from '@edfi/meadowlark-core';
import { Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getDocumentCollection, getNewClient } from '../../src/repository/Db';
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

const requestTimestamp: number = 1683326572053;

describe('given the upsert of a new document', () => {
  let client;
  let upsertResult: UpsertResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert1' },
    requestTimestamp,
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId,
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

  it('should exist in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result.resourceName).toBe('School');
    expect(result.edfiDoc.call).toBe('one');

    if (upsertResult.response !== 'INSERT_SUCCESS') throw new Error();
    expect(result.documentUuid).toBe(upsertResult.newDocumentUuid);
  });

  it('should have correct createdAt and lastModifiedAt', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result.createdAt).toBe(requestTimestamp);
    expect(result.lastModifiedAt).toBe(requestTimestamp);
  });

  it('should return insert success', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });
});

describe('given the upsert of an existing document three times', () => {
  let client;
  let upsertResult1: UpsertResult;
  let upsertResult2: UpsertResult;
  let upsertResult3: UpsertResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfoBase: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'key' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfoBase.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest1: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo: { ...documentInfoBase, requestTimestamp },
      edfiDoc: { natural: 'key' },
    };

    const upsertRequest2: UpsertRequest = {
      ...upsertRequest1,
      documentInfo: { ...documentInfoBase, requestTimestamp: requestTimestamp + 1 },
    };

    const upsertRequest3: UpsertRequest = {
      ...upsertRequest1,
      documentInfo: { ...documentInfoBase, requestTimestamp: requestTimestamp + 2 },
    };

    upsertResult1 = await upsertDocument(upsertRequest1, client);
    upsertResult2 = await upsertDocument(upsertRequest2, client);
    upsertResult3 = await upsertDocument(upsertRequest3, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return insert success on 1st upsert', async () => {
    expect(upsertResult1.response).toBe('INSERT_SUCCESS');
  });

  it('should return update success on 2nd upsert', async () => {
    expect(upsertResult2.response).toBe('UPDATE_SUCCESS');
  });

  it('should exist in the db on 2nd upsert', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result._id).toBe(meadowlarkId);

    if (upsertResult1.response !== 'INSERT_SUCCESS') throw new Error();
    expect(result.documentUuid).toBe(upsertResult1.newDocumentUuid);
  });

  it('should return same documentUuid orignally inserted', async () => {
    if (upsertResult1.response !== 'INSERT_SUCCESS') throw new Error();
    if (upsertResult2.response !== 'UPDATE_SUCCESS') throw new Error();
    expect(upsertResult2.existingDocumentUuid).toBe(upsertResult1.newDocumentUuid);
  });

  it('should return update success on 3rd upsert', async () => {
    if (upsertResult1.response !== 'INSERT_SUCCESS') throw new Error();
    if (upsertResult3.response !== 'UPDATE_SUCCESS') throw new Error();
    expect(upsertResult3.existingDocumentUuid).toBe(upsertResult1.newDocumentUuid);
  });

  it('should exist in the db on 3rd upsert', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result._id).toBe(meadowlarkId);
    if (upsertResult1.response !== 'INSERT_SUCCESS') throw new Error();
    expect(result.documentUuid).toBe(upsertResult1.newDocumentUuid);
  });

  it('should have only one document in db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const count: number = await collection.countDocuments();
    expect(count).toBe(1);
  });

  it('should have correct createdAt and lastModifiedAt', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result.createdAt).toBe(requestTimestamp);
    expect(result.lastModifiedAt).toBe(requestTimestamp + 2);
  });
});

describe('given an upsert of an existing non-identity-update supporting document, changing a non-identity portion of the edfiDoc', () => {
  let client;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
    allowIdentityUpdates: false,
  };
  const documentInfoBase: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert3' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfoBase.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest1: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo: { ...documentInfoBase, requestTimestamp },
    };

    const upsertRequest2: UpsertRequest = {
      ...upsertRequest1,
      documentInfo: { ...documentInfoBase, requestTimestamp: requestTimestamp + 1 },
    };

    await upsertDocument({ ...upsertRequest1, edfiDoc: { call: 'one', natural: 'upsert3' } }, client);
    await upsertDocument({ ...upsertRequest2, edfiDoc: { call: 'two', natural: 'upsert3' } }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have the change in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result.edfiDoc.call).toBe('two');
  });

  it('should have only one document in db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const count: number = await collection.countDocuments();
    expect(count).toBe(1);
  });

  it('should have correct createdAt and lastModifiedAt', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result.createdAt).toBe(requestTimestamp);
    expect(result.lastModifiedAt).toBe(requestTimestamp + 1);
  });
});

describe('given an upsert of an existing identity-update supporting document, changing a non-identity portion of the edfiDoc', () => {
  let client;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
    allowIdentityUpdates: true,
  };
  const documentInfoBase: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert3' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfoBase.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest1: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo: { ...documentInfoBase, requestTimestamp },
    };

    const upsertRequest2: UpsertRequest = {
      ...upsertRequest1,
      documentInfo: { ...documentInfoBase, requestTimestamp: requestTimestamp + 1 },
    };

    await upsertDocument({ ...upsertRequest1, edfiDoc: { call: 'one', natural: 'upsert3' } }, client);
    await upsertDocument({ ...upsertRequest2, edfiDoc: { call: 'two', natural: 'upsert3' } }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have the change in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result.edfiDoc.call).toBe('two');
  });

  it('should have only one document in db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const count: number = await collection.countDocuments();
    expect(count).toBe(1);
  });

  it('should have correct createdAt and lastModifiedAt', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result.createdAt).toBe(requestTimestamp);
    expect(result.lastModifiedAt).toBe(requestTimestamp + 1);
  });
});

describe('given an upsert of an existing non-identity update supporting document, changing an identity portion of the edfiDoc', () => {
  let client;
  let upsertResult1: UpsertResult;
  let upsertResult2: UpsertResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
    allowIdentityUpdates: false,
  };
  const documentInfo1: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'key1' },
    requestTimestamp,
  };
  const documentInfo2: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'key2' },
    requestTimestamp: requestTimestamp + 1,
  };

  const meadowlarkId1 = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo1.documentIdentity);
  const meadowlarkId2 = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo2.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest1: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId: meadowlarkId1,
      resourceInfo,
      documentInfo: documentInfo1,
    };
    const upsertRequest2: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId: meadowlarkId2,
      resourceInfo,
      documentInfo: documentInfo2,
    };

    upsertResult1 = await upsertDocument({ ...upsertRequest1, edfiDoc: { call: 'one', natural: 'key1' } }, client);
    upsertResult2 = await upsertDocument({ ...upsertRequest2, edfiDoc: { call: 'one', natural: 'key2' } }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have insert success for both documents', async () => {
    expect(upsertResult1.response).toBe('INSERT_SUCCESS');
    expect(upsertResult2.response).toBe('INSERT_SUCCESS');
  });

  it('should have the 1st document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId1 });
    if (upsertResult1.response !== 'INSERT_SUCCESS') throw new Error();
    expect(result.documentUuid).toBe(upsertResult1.newDocumentUuid);
  });

  it('should have the 2nd document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId2 });
    if (upsertResult2.response !== 'INSERT_SUCCESS') throw new Error();
    expect(result.documentUuid).toBe(upsertResult2.newDocumentUuid);
  });

  it('should have two documents in db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const count: number = await collection.countDocuments();
    expect(count).toBe(2);
  });

  it('should have correct createdAt and lastModifiedAt for 1st document', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId1 });
    expect(result.createdAt).toBe(requestTimestamp);
    expect(result.lastModifiedAt).toBe(requestTimestamp);
  });

  it('should have correct createdAt and lastModifiedAt for 2nd document', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId2 });
    expect(result.createdAt).toBe(requestTimestamp + 1);
    expect(result.lastModifiedAt).toBe(requestTimestamp + 1);
  });
});

describe('given an upsert of an existing identity update supporting document, changing an identity portion of the edfiDoc', () => {
  let client;
  let upsertResult1: UpsertResult;
  let upsertResult2: UpsertResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
    allowIdentityUpdates: true,
  };
  const documentInfo1: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'key1' },
    requestTimestamp,
  };
  const documentInfo2: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'key2' },
    requestTimestamp: requestTimestamp + 1,
  };

  const meadowlarkId1 = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo1.documentIdentity);
  const meadowlarkId2 = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo2.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest1: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId: meadowlarkId1,
      resourceInfo,
      documentInfo: documentInfo1,
    };
    const upsertRequest2: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId: meadowlarkId2,
      resourceInfo,
      documentInfo: documentInfo2,
    };

    upsertResult1 = await upsertDocument({ ...upsertRequest1, edfiDoc: { call: 'one', natural: 'key1' } }, client);
    upsertResult2 = await upsertDocument({ ...upsertRequest2, edfiDoc: { call: 'one', natural: 'key2' } }, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have insert success for both documents', async () => {
    expect(upsertResult1.response).toBe('INSERT_SUCCESS');
    expect(upsertResult2.response).toBe('INSERT_SUCCESS');
  });

  it('should have the 1st document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId1 });
    if (upsertResult1.response !== 'INSERT_SUCCESS') throw new Error();
    expect(result.documentUuid).toBe(upsertResult1.newDocumentUuid);
  });

  it('should have the 2nd document in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId2 });
    if (upsertResult2.response !== 'INSERT_SUCCESS') throw new Error();
    expect(result.documentUuid).toBe(upsertResult2.newDocumentUuid);
  });

  it('should have two documents in db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const count: number = await collection.countDocuments();
    expect(count).toBe(2);
  });

  it('should have correct createdAt and lastModifiedAt for 1st document', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId1 });
    expect(result.createdAt).toBe(requestTimestamp);
    expect(result.lastModifiedAt).toBe(requestTimestamp);
  });

  it('should have correct createdAt and lastModifiedAt for 2nd document', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId2 });
    expect(result.createdAt).toBe(requestTimestamp + 1);
    expect(result.lastModifiedAt).toBe(requestTimestamp + 1);
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
  documentWithReferencesInfo.documentReferences = [invalidReference];

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    // The new document with an invalid reference
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
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned insert success for the document with invalid reference but validation off', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have inserted the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
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
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert6' },
    documentReferences: [validReference],
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
        meadowlarkId: referencedMeadowlarkId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The new document with a valid reference
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
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned insert success for the document with a valid reference', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have inserted the document with a valid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
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
        meadowlarkId: referencedMeadowlarkId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The new document with both valid and invalid references
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
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have returned a failure to insert the document with an invalid reference', async () => {
    expect(upsertResult.response).toBe('INSERT_FAILURE_REFERENCE');
    expect(upsertResult.failureMessage).toMatchInlineSnapshot(`
      {
        "error": {
          "failures": [
            {
              "identity": {
                "natural": "not a valid reference",
              },
              "resourceName": "School",
            },
          ],
          "message": "Reference validation failed",
        },
      }
    `);
  });

  it('should not have inserted the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
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
    resourceName: 'AcademicWeek',
  };
  const documentWithReferenceDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { week: 'update6' },
    documentReferences: [referenceAsSuperclass],
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
        meadowlarkId: referencedMeadowlarkId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The new upserted document with reference as superclass
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
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return success for document insert with a valid reference to superclass', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have a valid reference to superclass in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.outboundRefs).toMatchInlineSnapshot(`
      [
        "BS3Ub80H5FHOD2j0qzdjhJXZsGSfcZtPWaiepA",
      ]
    `);
  });
});

describe('given an upsert of a subclass document when a different subclass has the same superclass identity', () => {
  let client;
  let upsertResult;

  const documentIdentity: DocumentIdentity = { educationOrganizationId: '123' };

  const superclassInfo: SuperclassInfo = {
    ...newSuperclassInfo(),
    documentIdentity,
    resourceName: 'EducationOrganization',
    projectName: 'Ed-Fi',
  };

  const existingSubclassResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const existingSubclassDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { schoolId: '123' },
    superclassInfo,
  };
  const existingSubclassId = meadowlarkIdForDocumentIdentity(
    existingSubclassResourceInfo,
    existingSubclassDocumentInfo.documentIdentity,
  );

  const sameSuperclassIdentityResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'LocalEducationAgency',
  };
  const sameSuperclassIdentityDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { localEducationAgencyId: '123' },
    superclassInfo,
  };
  const sameSuperclassIdentityId = meadowlarkIdForDocumentIdentity(
    sameSuperclassIdentityResourceInfo,
    sameSuperclassIdentityDocumentInfo.documentIdentity,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;

    //  The existing subclass
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: existingSubclassId,
        resourceInfo: existingSubclassResourceInfo,
        documentInfo: existingSubclassDocumentInfo,
      },
      client,
    );

    // The new upserted subclass with the same superclass identity
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: sameSuperclassIdentityId,
        resourceInfo: sameSuperclassIdentityResourceInfo,
        documentInfo: sameSuperclassIdentityDocumentInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return failure for document insert with same superclass identity as a different superclass', async () => {
    expect(upsertResult.response).toBe('INSERT_FAILURE_CONFLICT');
    expect(upsertResult.failureMessage).toMatchInlineSnapshot(
      `"Insert failed: the identity is in use by 'LocalEducationAgency' which is also a(n) 'EducationOrganization'"`,
    );
  });

  it('should not have inserted the document with the same superclass identity in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: sameSuperclassIdentityId });
    expect(result).toBe(null);
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
    requestTimestamp,
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
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: false,
      },
      client,
    );

    // Update the document with an invalid reference
    documentWithReferencesInfo.documentReferences = [invalidReference];
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: { ...documentWithReferencesInfo, requestTimestamp: requestTimestamp + 1 },
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
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with an invalid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.documentIdentity.natural).toBe('upsert4');
    expect(result.outboundRefs).toMatchInlineSnapshot(`
      [
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
    requestTimestamp,
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
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert6' },
    requestTimestamp: requestTimestamp + 1,
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
        meadowlarkId: referencedMeadowlarkId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The original document with no reference
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );

    // The updated document with a valid reference
    documentWithReferencesInfo.documentReferences = [validReference];
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: { ...documentWithReferencesInfo, requestTimestamp: requestTimestamp + 2 },
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
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: documentWithReferencesId });
    expect(result.documentIdentity.natural).toBe('upsert6');
    expect(result.outboundRefs).toMatchInlineSnapshot(`
      [
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
    requestTimestamp,
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
    requestTimestamp: requestTimestamp + 1,
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
        meadowlarkId: referencedMeadowlarkId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The original document with no references
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );

    // The updated document with both valid and invalid references
    documentWithReferencesInfo.documentReferences = [validReference, invalidReference];
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: { ...documentWithReferencesInfo, requestTimestamp: requestTimestamp + 2 },
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
    expect(upsertResult.response).toBe('UPDATE_FAILURE_REFERENCE');
    expect(upsertResult.failureMessage).toMatchInlineSnapshot(`
      {
        "error": {
          "failures": [
            {
              "identity": {
                "natural": "not a valid reference",
              },
              "resourceName": "School",
            },
          ],
          "message": "Reference validation failed",
        },
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
    requestTimestamp,
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
    resourceName: 'AcademicWeek',
  };
  const documentWithReferenceDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { week: 'update6' },
    requestTimestamp: requestTimestamp + 1,
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
        meadowlarkId: referencedMeadowlarkId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The original document with no reference
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferenceResourceInfo,
        documentInfo: documentWithReferenceDocumentInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );

    // The updated document with reference as superclass
    documentWithReferenceDocumentInfo.documentReferences = [referenceAsSuperclass];
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferenceResourceInfo,
        documentInfo: { ...documentWithReferenceDocumentInfo, requestTimestamp: requestTimestamp + 2 },
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
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
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

describe('given the upsert of an existing document with a stale request timestamp', () => {
  let client;
  let upsertResult1: UpsertResult;
  let upsertResult2: UpsertResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfoBase: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'key' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfoBase.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const upsertRequest1: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo: { ...documentInfoBase, requestTimestamp },
      edfiDoc: { natural: 'key' },
    };

    const upsertRequest2: UpsertRequest = {
      ...upsertRequest1,
      documentInfo: { ...documentInfoBase, requestTimestamp: requestTimestamp - 1 },
    };

    upsertResult1 = await upsertDocument(upsertRequest1, client);
    upsertResult2 = await upsertDocument(upsertRequest2, client);
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should return insert success on 1st upsert', async () => {
    expect(upsertResult1.response).toBe('INSERT_SUCCESS');
  });

  it('should return update failure on 2nd upsert', async () => {
    expect(upsertResult2.response).toBe('UPSERT_FAILURE_WRITE_CONFLICT');
  });

  it('should exist in the db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result._id).toBe(meadowlarkId);

    if (upsertResult1.response !== 'INSERT_SUCCESS') throw new Error();
    expect(result.documentUuid).toBe(upsertResult1.newDocumentUuid);
  });

  it('should have only one document in db', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const count: number = await collection.countDocuments();
    expect(count).toBe(1);
  });

  it('should have correct createdAt and lastModifiedAt', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: meadowlarkId });
    expect(result.createdAt).toBe(requestTimestamp);
    expect(result.lastModifiedAt).toBe(requestTimestamp);
  });
});
