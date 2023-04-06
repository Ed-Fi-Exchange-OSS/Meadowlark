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
import { findDocumentByIdSql, findAliasIdsForDocumentSql } from '../../src/repository/SqlHelper';
import { upsertDocument } from '../../src/repository/Upsert';
import { setupConfigForIntegration } from './Config';
import { deleteAll, retrieveReferencesByDocumentIdSql, verifyAliasId } from './TestHelper';



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
    await setupConfigForIntegration();

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
    const result = await client.query(findAliasIdsForDocumentSql(meadowlarkId));

    expect(result.rowCount).toBe(1);
  });

  it('should return insert success', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });
});

describe('given the upsert of an existing document twice', () => {
  let client: PoolClient;
  let upsertResult1: UpsertResult;
  let upsertResult2: UpsertResult;
  let upsertResult3: UpsertResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'upsert2' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = await getSharedClient();
    const upsertRequest: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo,
      edfiDoc: { natural: 'key' },
    };

    upsertResult1 = await upsertDocument(upsertRequest, client);
    upsertResult2 = await upsertDocument(upsertRequest, client);
    upsertResult3 = await upsertDocument(upsertRequest, client);
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
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    await setupConfigForIntegration();

    const upsertRequest: UpsertRequest = { ...newUpsertRequest(), meadowlarkId, resourceInfo, documentInfo };

    client = await getSharedClient();
    await upsertDocument({ ...upsertRequest, edfiDoc: { call: 'one' } }, client);
    await upsertDocument({ ...upsertRequest, edfiDoc: { call: 'two' } }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    // End the connection with the database
    await resetSharedClient();
  });

  it('should have the change in the db', async () => {
    const result: any = await client.query(findDocumentByIdSql(meadowlarkId));

    expect(result.rows[0].edfi_doc.call).toBe('two');
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

    client = await getSharedClient();

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
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should have returned insert success for the document with invalid reference but validation off', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have inserted the document with an invalid reference in the db', async () => {
    const result: any = await client.query(findDocumentByIdSql(documentWithReferencesId));
    expect(result.rows[0].document_identity.natural).toBe('upsert4');
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
    documentIdentity: { natural: 'upsert6' },
    documentReferences: [validReference],
  };
  const documentWithReferencesId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getSharedClient()) as PoolClient;

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
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should have returned insert success for the document with a valid reference', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have inserted the document with a valid reference in the db', async () => {
    const result: any = await client.query(findDocumentByIdSql(documentWithReferencesId));
    expect(result.rows[0].document_identity.natural).toBe('upsert6');
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
    documentIdentity: { natural: 'upsert8' },
    documentReferences: [validReference, invalidReference],
  };
  const documentWithReferencesId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getSharedClient()) as PoolClient;

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
    const result: any = await client.query(findDocumentByIdSql(documentWithReferencesId));
    expect(result.rowCount).toEqual(0);
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

    client = (await getSharedClient()) as PoolClient;

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
    const result: any = await client.query(findDocumentByIdSql(sameSuperclassIdentityId));
    expect(result.rowCount).toEqual(0);
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

    client = (await getSharedClient()) as PoolClient;

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

  it('should have returned update success for the document with invalid reference but validation off', async () => {
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with an invalid reference in the db', async () => {
    const docResult: any = await client.query(findDocumentByIdSql(documentWithReferencesId));
    const refsResult: any = await client.query(retrieveReferencesByDocumentIdSql(documentWithReferencesId));

    const outboundRefs = refsResult.rows.map((ref) => ref.referenced_document_id);
    expect(docResult.rows[0].document_identity.natural).toBe('upsert4');
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
    documentIdentity: { natural: 'upsert6' },
  };
  const documentWithReferencesId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getSharedClient()) as PoolClient;

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

  it('should have returned update success for the document with a valid reference', async () => {
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference in the db', async () => {
    const docResult: any = await client.query(findDocumentByIdSql(documentWithReferencesId));
    const refsResult: any = await client.query(retrieveReferencesByDocumentIdSql(documentWithReferencesId));

    const outboundRefs = refsResult.rows.map((ref) => ref.referenced_document_id);

    expect(docResult.rows[0].document_identity.natural).toBe('upsert6');
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
    documentIdentity: { natural: 'upsert8' },
  };
  const documentWithReferencesId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getSharedClient()) as PoolClient;

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
    await client.query(findDocumentByIdSql(documentWithReferencesId));
    const refsResult: any = await client.query(retrieveReferencesByDocumentIdSql(documentWithReferencesId));

    const outboundRefs = refsResult.rows.map((ref) => ref.referenced_document_id);

    expect(outboundRefs).toHaveLength(0);
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

    client = (await getSharedClient()) as PoolClient;

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
        documentInfo: documentWithReferenceDocumentInfo,
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
    const result: any = await client.query(verifyAliasId(referencedDocumentId));
    const outboundRefs = result.rows.map((row) => row.alias_id);
    expect(outboundRefs).toMatchInlineSnapshot(`
      [
        "BS3Ub80H5FHOD2j0qzdjhJXZsGSfcZtPWaiepA",
      ]
    `);
  });
});
