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
  UpsertResult,
  DocumentReference,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  GetRequest,
} from '@edfi/meadowlark-core';
import type { PoolClient } from 'pg';
import { getSharedClient, resetSharedClient } from '../../src/repository/Db';
import { upsertDocument } from '../../src/repository/Upsert';
import { deleteAll } from './TestHelper';
import { getDocumentById } from '../../src/repository/Get';
import { checkDocumentExistsSql, documentByIdSql, retrieveReferencesByDocumentIdSql } from '../../src/repository/SqlHelper';

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

const newGetRequest = (): GetRequest => ({
  id: '',
  resourceInfo: NoResourceInfo,
  security: { ...newSecurity() },
  traceId: 'traceId',
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
    documentIdentity: [{ name: 'natural', value: 'upsert1' }],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    client = await getSharedClient();

    upsertResult = await upsertDocument(
      { ...newUpsertRequest(), id, resourceInfo, documentInfo, edfiDoc: { call: 'one' }, validate: false },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    await resetSharedClient();
  });

  it('should exist in the db', async () => {
    const result = await client.query(checkDocumentExistsSql(id));

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
    documentIdentity: [{ name: 'natural', value: 'upsert2' }],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    client = await getSharedClient();
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
    await deleteAll(client);
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
    documentIdentity: [{ name: 'natural', value: 'upsert3' }],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    const upsertRequest: UpsertRequest = { ...newUpsertRequest(), id, resourceInfo, documentInfo };

    client = await getSharedClient();
    await upsertDocument({ ...upsertRequest, edfiDoc: { call: 'one' } }, client);
    await upsertDocument({ ...upsertRequest, edfiDoc: { call: 'two' } }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    // End the connection with the database
    await resetSharedClient();
  });

  it('should have the change in the db', async () => {
    const result: any = await getDocumentById({ ...newGetRequest(), id }, client);

    expect(result.document.call).toBe('two');
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
    documentIdentity: [{ name: 'natural', value: 'upsert4' }],
  };

  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  const invalidReference: DocumentReference = {
    projectName: documentWithReferencesResourceInfo.projectName,
    resourceName: documentWithReferencesResourceInfo.resourceName,
    resourceVersion: documentWithReferencesResourceInfo.resourceVersion,
    isAssignableFrom: false,
    documentIdentity: [{ name: 'natural', value: 'not a valid reference' }],
    isDescriptor: false,
  };
  documentWithReferencesInfo.documentReferences = [invalidReference];

  beforeAll(async () => {
    client = await getSharedClient();

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
    await deleteAll(client);
    await resetSharedClient();
  });

  it('should have returned insert success for the document with invalid reference but validation off', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have inserted the document with an invalid reference in the db', async () => {
    const result: any = await client.query(documentByIdSql(documentWithReferencesId));
    const val = result.rows[0].document_identity[0].value;
    expect(val).toBe('upsert4');
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
    documentIdentity: [{ name: 'natural', value: 'upsert5' }],
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
    documentIdentity: [{ name: 'natural', value: 'upsert6' }],
    documentReferences: [validReference],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

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
    await deleteAll(client);
    await resetSharedClient();
  });

  it('should have returned insert success for the document with a valid reference', async () => {
    expect(upsertResult.response).toBe('INSERT_SUCCESS');
  });

  it('should have inserted the document with a valid reference in the db', async () => {
    const result: any = await client.query(documentByIdSql(documentWithReferencesId));
    expect(result.rows[0].document_identity[0].value).toBe('upsert6');
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
    documentIdentity: [{ name: 'natural', value: 'upsert7' }],
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

  const invalidReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    resourceVersion: referencedResourceInfo.resourceVersion,
    isAssignableFrom: false,
    documentIdentity: [{ name: 'natural', value: 'not a valid reference' }],
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'upsert8' }],
    documentReferences: [validReference, invalidReference],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

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
    await deleteAll(client);
    await resetSharedClient();
  });

  it('should have returned a failure to insert the document with an invalid reference', async () => {
    expect(upsertResult.response).toBe('INSERT_FAILURE_REFERENCE');
    expect(upsertResult.failureMessage).toMatchInlineSnapshot(
      `"Reference validation failed: Resource School is missing identity [{\\"name\\":\\"natural\\",\\"value\\":\\"not a valid reference\\"}]"`,
    );
  });

  it('should not have inserted the document with an invalid reference in the db', async () => {
    const result: any = await client.query(documentByIdSql(documentWithReferencesId));
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
    documentIdentity: [{ name: 'natural', value: 'upsert4' }],
  };

  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  const invalidReference: DocumentReference = {
    projectName: documentWithReferencesResourceInfo.projectName,
    resourceName: documentWithReferencesResourceInfo.resourceName,
    resourceVersion: documentWithReferencesResourceInfo.resourceVersion,
    isAssignableFrom: false,
    documentIdentity: [{ name: 'natural', value: 'not a valid reference' }],
    isDescriptor: false,
  };

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

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
    await deleteAll(client);
    await resetSharedClient();
  });

  it('should have returned update success for the document with invalid reference but validation off', async () => {
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with an invalid reference in the db', async () => {
    const docResult: any = await client.query(documentByIdSql(documentWithReferencesId));
    const refsResult: any = await client.query(retrieveReferencesByDocumentIdSql(documentWithReferencesId));

    const outRefs = refsResult.rows.map((ref) => ref.referenced_document_id);
    expect(docResult.rows[0].document_identity[0].value).toBe('upsert4');
    expect(outRefs).toMatchInlineSnapshot(`
        Array [
          "iWC9ClbnyZUAkYO5Gsk3d9wTUaaw46YGOLW6pA",
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
    documentIdentity: [{ name: 'natural', value: 'upsert5' }],
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
    documentIdentity: [{ name: 'natural', value: 'upsert6' }],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

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
    await deleteAll(client);
    await resetSharedClient();
  });

  it('should have returned update success for the document with a valid reference', async () => {
    expect(upsertResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference in the db', async () => {
    const docResult: any = await client.query(documentByIdSql(documentWithReferencesId));
    const refsResult: any = await client.query(retrieveReferencesByDocumentIdSql(documentWithReferencesId));

    const outRefs = refsResult.rows.map((ref) => ref.referenced_document_id);

    expect(docResult.rows[0].document_identity[0].value).toBe('upsert6');
    expect(outRefs).toMatchInlineSnapshot(`
      Array [
        "xQa2iY3pvOaXWs_--xdlZjOYgjJXvD9_wbI6EQ",
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
    documentIdentity: [{ name: 'natural', value: 'upsert7' }],
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

  const invalidReference: DocumentReference = {
    projectName: referencedResourceInfo.projectName,
    resourceName: referencedResourceInfo.resourceName,
    resourceVersion: referencedResourceInfo.resourceVersion,
    isAssignableFrom: false,
    documentIdentity: [{ name: 'natural', value: 'not a valid reference' }],
    isDescriptor: false,
  };

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'upsert8' }],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

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
    await deleteAll(client);
    await resetSharedClient();
  });

  it('should have returned a failure to insert the document with an invalid reference', async () => {
    expect(upsertResult.response).toBe('UPDATE_FAILURE_REFERENCE');
    expect(upsertResult.failureMessage).toMatchInlineSnapshot(
      `"Reference validation failed: Resource School is missing identity [{\\"name\\":\\"natural\\",\\"value\\":\\"not a valid reference\\"}]"`,
    );
  });

  it('should not have updated the document with an invalid reference in the db', async () => {
    await client.query(documentByIdSql(documentWithReferencesId));
    const refsResult: any = await client.query(retrieveReferencesByDocumentIdSql(documentWithReferencesId));

    const outRefs = refsResult.rows.map((ref) => ref.referenced_document_id);

    expect(outRefs).toHaveLength(0);
  });
});
