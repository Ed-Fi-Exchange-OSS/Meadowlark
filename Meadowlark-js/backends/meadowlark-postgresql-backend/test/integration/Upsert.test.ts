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
  SuperclassInfo,
  newSuperclassInfo,
  UpsertResult,
  DocumentIdentity,
  MeadowlarkId,
  TraceId,
} from '@edfi/meadowlark-core';
import type { PoolClient } from 'pg';
import { getSharedClient, resetSharedClient } from '../../src/repository/Db';
import { findDocumentByMeadowlarkId, findAliasMeadowlarkIdsForDocumentByMeadowlarkId } from '../../src/repository/SqlHelper';
import { upsertDocument } from '../../src/repository/Upsert';
import { deleteAll, retrieveReferencesByMeadowlarkIdSql, verifyAliasMeadowlarkId } from './TestHelper';
import { MeadowlarkDocument, NoMeadowlarkDocument } from '../../src/model/MeadowlarkDocument';

const requestTimestamp: number = 1683326572053;

const newUpsertRequest = (): UpsertRequest => ({
  meadowlarkId: '' as MeadowlarkId,
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

describe('given the upsert of a new document', () => {
  let client: PoolClient;
  let upsertResult: UpsertResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert1' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    client = await getSharedClient();

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
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should exist in the db', async () => {
    const result: MeadowlarkId[] = await findAliasMeadowlarkIdsForDocumentByMeadowlarkId(client, meadowlarkId);

    expect(result.length).toBe(1);
  });

  it('should return insert success', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });
});

describe('given the upsert of an existing document three times', () => {
  let client: PoolClient;
  let upsertResult1: UpsertResult;
  let upsertResult2: UpsertResult;
  let upsertResult3: UpsertResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfoBase: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert2' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfoBase.documentIdentity);

  beforeAll(async () => {
    client = await getSharedClient();
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
    await deleteAll(client);
    client.release();
    await resetSharedClient();
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

  it('should have the document in the db', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, meadowlarkId);
    expect(result.edfi_doc.natural).toBe('key');
  });

  it('should have correct createdAt and lastModifiedAt', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, meadowlarkId);
    expect(result.created_at).toBe(requestTimestamp);
    expect(result.last_modified_at).toBe(requestTimestamp + 2);
  });
});

describe('given an upsert of an existing document that changes the edfiDoc', () => {
  let client: PoolClient;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert3' },
    requestTimestamp,
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    const upsertRequest1: UpsertRequest = { ...newUpsertRequest(), meadowlarkId, resourceInfo, documentInfo };
    const upsertRequest2: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo: { ...documentInfo, requestTimestamp: requestTimestamp + 1 },
    };

    client = await getSharedClient();
    await upsertDocument({ ...upsertRequest1, edfiDoc: { call: 'one' } }, client);
    await upsertDocument({ ...upsertRequest2, edfiDoc: { call: 'two' } }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    // End the connection with the database
    await resetSharedClient();
  });

  it('should have the change in the db', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, meadowlarkId);

    expect(result.edfi_doc.call).toBe('two');
  });

  it('should have correct createdAt and lastModifiedAt', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, meadowlarkId);
    expect(result.created_at).toBe(requestTimestamp);
    expect(result.last_modified_at).toBe(requestTimestamp + 1);
  });
});

describe('given an attempted upsert of an existing document with a stale request', () => {
  let client: PoolClient;
  let upsertResult2: UpsertResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert3' },
    requestTimestamp,
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    const upsertRequest1: UpsertRequest = { ...newUpsertRequest(), meadowlarkId, resourceInfo, documentInfo };
    const upsertRequest2: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo: { ...documentInfo, requestTimestamp: requestTimestamp - 1 },
    };

    client = await getSharedClient();
    await upsertDocument({ ...upsertRequest1, edfiDoc: { call: 'one' } }, client);
    upsertResult2 = await upsertDocument({ ...upsertRequest2, edfiDoc: { call: 'two' } }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    // End the connection with the database
    await resetSharedClient();
  });

  it('should return upssert failure', async () => {
    expect(upsertResult2.response).toBe('UPSERT_FAILURE_WRITE_CONFLICT');
  });

  it('should not have the change in the db', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, meadowlarkId);
    expect(result.edfi_doc.call).toBe('one');
  });

  it('should have correct createdAt and lastModifiedAt', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, meadowlarkId);
    expect(result.created_at).toBe(requestTimestamp);
    expect(result.last_modified_at).toBe(requestTimestamp);
  });
});

describe('given an upsert of a new document that references a non-existent document with validation off', () => {
  let client: PoolClient;
  let upsertResult: UpsertResult;

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert4' },
  };

  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
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
    client = await getSharedClient();

    // The new document with an invalid reference
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesMeadowlarkId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: false,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should have returned insert success for the document with invalid reference but validation off', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have inserted the document with an invalid reference in the db', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, documentWithReferencesMeadowlarkId);
    expect(result.document_identity.natural).toBe('upsert4');
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
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

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
        meadowlarkId: documentWithReferencesMeadowlarkId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should have returned insert success for the document with a valid reference', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have inserted the document with a valid reference in the db', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, documentWithReferencesMeadowlarkId);
    expect(result.document_identity.natural).toBe('upsert6');
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
    documentReferences: [validReference, invalidReference],
    requestTimestamp: requestTimestamp + 1,
  };
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

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
        meadowlarkId: documentWithReferencesMeadowlarkId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
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
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, documentWithReferencesMeadowlarkId);
    expect(result).toBe(NoMeadowlarkDocument);
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
  const existingSubclassMeadowlarkId = meadowlarkIdForDocumentIdentity(
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
  const sameSuperclassIdentityMeadowlarkId = meadowlarkIdForDocumentIdentity(
    sameSuperclassIdentityResourceInfo,
    sameSuperclassIdentityDocumentInfo.documentIdentity,
  );

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

    //  The existing subclass
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: existingSubclassMeadowlarkId,
        resourceInfo: existingSubclassResourceInfo,
        documentInfo: existingSubclassDocumentInfo,
      },
      client,
    );

    // The new upserted subclass with the same superclass identity
    upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: sameSuperclassIdentityMeadowlarkId,
        resourceInfo: sameSuperclassIdentityResourceInfo,
        documentInfo: sameSuperclassIdentityDocumentInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should return failure for document insert with same superclass identity as a different superclass', async () => {
    expect(upsertResult.response).toBe('INSERT_FAILURE_CONFLICT');
    expect(upsertResult.failureMessage).toMatchInlineSnapshot(
      `"Insert failed: the identity is in use by 'LocalEducationAgency' which is also a(n) 'EducationOrganization'"`,
    );
  });

  it('should not have inserted the document with the same superclass identity in the db', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, sameSuperclassIdentityMeadowlarkId);
    expect(result).toBe(NoMeadowlarkDocument);
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

  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
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
    client = (await getSharedClient()) as PoolClient;

    // Insert the original document with no reference
    await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesMeadowlarkId,
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
        meadowlarkId: documentWithReferencesMeadowlarkId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: { ...documentWithReferencesInfo, requestTimestamp: requestTimestamp + 1 },
        validateDocumentReferencesExist: false,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should have returned update success for the document with invalid reference but validation off', async () => {
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with an invalid reference in the db', async () => {
    const docResult: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, documentWithReferencesMeadowlarkId);
    const refsResult: any = await client.query(retrieveReferencesByMeadowlarkIdSql(documentWithReferencesMeadowlarkId));

    const outboundRefs = refsResult.rows.map((ref) => ref.referenced_meadowlark_id);
    expect(docResult.document_identity.natural).toBe('upsert4');
    expect(outboundRefs).toMatchInlineSnapshot(`
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
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

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
        meadowlarkId: documentWithReferencesMeadowlarkId,
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
        meadowlarkId: documentWithReferencesMeadowlarkId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: { ...documentWithReferencesInfo, requestTimestamp: requestTimestamp + 2 },
        validateDocumentReferencesExist: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should have returned update success for the document with a valid reference', async () => {
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference in the db', async () => {
    const docResult: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, documentWithReferencesMeadowlarkId);
    const refsResult: any = await client.query(retrieveReferencesByMeadowlarkIdSql(documentWithReferencesMeadowlarkId));

    const outboundRefs = refsResult.rows.map((ref) => ref.referenced_meadowlark_id);

    expect(docResult.document_identity.natural).toBe('upsert6');
    expect(outboundRefs).toMatchInlineSnapshot(`
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
  const documentWithReferencesMeadowlarkId: MeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

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
        meadowlarkId: documentWithReferencesMeadowlarkId,
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
        meadowlarkId: documentWithReferencesMeadowlarkId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: { ...documentWithReferencesInfo, requestTimestamp: requestTimestamp + 3 },
        validateDocumentReferencesExist: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
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
    await findDocumentByMeadowlarkId(client, documentWithReferencesMeadowlarkId);
    const refsResult: any = await client.query(retrieveReferencesByMeadowlarkIdSql(documentWithReferencesMeadowlarkId));
    const outboundRefs = refsResult.rows.map((ref) => ref.referenced_meadowlark_id);
    expect(outboundRefs).toHaveLength(0);
  });

  it('should have correct createdAt and lastModifiedAt', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, documentWithReferencesMeadowlarkId);
    expect(result.created_at).toBe(requestTimestamp + 1);
    expect(result.last_modified_at).toBe(requestTimestamp + 1);
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
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferenceResourceInfo,
    documentWithReferenceDocumentInfo.documentIdentity,
  );

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

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
        meadowlarkId: documentWithReferencesMeadowlarkId,
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
        meadowlarkId: documentWithReferencesMeadowlarkId,
        resourceInfo: documentWithReferenceResourceInfo,
        documentInfo: { ...documentWithReferenceDocumentInfo, requestTimestamp: requestTimestamp + 2 },
        validateDocumentReferencesExist: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should return success for the document with a valid reference to superclass', async () => {
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference to superclass in the db', async () => {
    const result: any = await client.query(verifyAliasMeadowlarkId(referencedMeadowlarkId));
    const outboundRefs = result.rows.map((row) => row.alias_meadowlark_id);
    expect(outboundRefs).toMatchInlineSnapshot(`
      [
        "BS3Ub80H5FHOD2j0qzdjhJXZsGSfcZtPWaiepA",
      ]
    `);
  });

  it('should have correct createdAt and lastModifiedAt', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, documentWithReferencesMeadowlarkId);
    expect(result.created_at).toBe(requestTimestamp + 1);
    expect(result.last_modified_at).toBe(requestTimestamp + 2);
  });
});
