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
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  GetResult,
  GetRequest,
  UpdateResult,
} from '@edfi/meadowlark-core';
import type { PoolClient } from 'pg';
import { resetSharedClient, getSharedClient } from '../../src/repository/Db';
import { updateDocumentById } from '../../src/repository/Update';
import { upsertDocument } from '../../src/repository/Upsert';
import { deleteAll } from './TestHelper';
import { getDocumentById } from '../../src/repository/Get';
import { documentByIdSql, retrieveReferencesByDocumentIdSql } from '../../src/repository/SqlHelper';

jest.setTimeout(40000);

const newUpdateRequest = (): UpdateRequest => ({
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

describe('given the update of a non-existent document', () => {
  let client: PoolClient;
  let updateResult: UpdateResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'update1' }],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    client = await getSharedClient();

    updateResult = await updateDocumentById(
      { ...newUpdateRequest(), id, resourceInfo, documentInfo, edfiDoc: { call: 'one' }, validate: false },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    await resetSharedClient();
  });

  it('should not exist in the db', async () => {
    const result: GetResult = await getDocumentById({ ...newGetRequest(), id }, client);

    expect(result.response).toBe('GET_FAILURE_NOT_EXISTS');
  });

  it('should return update failure', async () => {
    expect(updateResult.response).toBe('UPDATE_FAILURE_NOT_EXISTS');
  });
});

describe('given the update of an existing document', () => {
  let client: PoolClient;
  let updateResult: UpdateResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'update2' }],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);

  beforeAll(async () => {
    client = await getSharedClient();
    const updateRequest: UpdateRequest = {
      ...newUpdateRequest(),
      id,
      resourceInfo,
      documentInfo,
      edfiDoc: { natural: 'key' },
    };

    // insert the initial version
    await upsertDocument(updateRequest, client);

    updateResult = await updateDocumentById({ ...updateRequest, edfiDoc: { changeToDoc: true } }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    await resetSharedClient();
  });

  it('should return update success', async () => {
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document in the db', async () => {
    const result: any = await client.query(documentByIdSql(id));
    // await getDocumentById({ ...newGetRequest(), id }, client);

    expect(result.rows[0].document_identity[0].value).toBe('update2');

    expect(result.rows[0].edfi_doc.changeToDoc).toBe(true);
  });
});

describe('given an update of a document that references a non-existent document with validation off', () => {
  let client: PoolClient;
  let updateResult: UpdateResult;

  const documentWithReferencesResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'AcademicWeek',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'update4' }],
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
    client = await getSharedClient();

    // Insert the original document with no reference
    await upsertDocument(
      {
        ...newUpdateRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: false,
      },
      client,
    );

    // Update the document with an invalid reference
    documentWithReferencesInfo.documentReferences = [invalidReference];
    updateResult = await updateDocumentById(
      {
        ...newUpdateRequest(),
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
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with an invalid reference in the db', async () => {
    const docResult: any = await client.query(documentByIdSql(documentWithReferencesId));
    const refsResult: any = await client.query(retrieveReferencesByDocumentIdSql(documentWithReferencesId));

    const outRefs = refsResult.rows.map((ref) => ref.referenced_document_id);

    expect(docResult.rows[0].document_identity[0].value).toBe('update4');

    expect(outRefs).toMatchInlineSnapshot(`
      Array [
        "iWC9ClbnyZUAkYO5Gsk3d9wTUaaw46YGOLW6pA",
      ]
    `);
  });
});

describe('given an update of a document that references an existing document with validation on', () => {
  let client;
  let updateResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'update5' }],
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
    documentIdentity: [{ name: 'natural', value: 'update6' }],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

    // The document that will be referenced
    await upsertDocument(
      {
        ...newUpdateRequest(),
        id: referencedDocumentId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The original document with no reference
    await upsertDocument(
      {
        ...newUpdateRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: true,
      },
      client,
    );

    // The updated document with a valid reference
    documentWithReferencesInfo.documentReferences = [validReference];
    updateResult = await updateDocumentById(
      {
        ...newUpdateRequest(),
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
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference in the db', async () => {
    const docResult: any = await client.query(documentByIdSql(documentWithReferencesId));
    const refsResult: any = await client.query(retrieveReferencesByDocumentIdSql(documentWithReferencesId));

    const outRefs = refsResult.rows.map((ref) => ref.referenced_document_id);
    expect(docResult.rows[0].document_identity[0].value).toBe('update6');
    expect(outRefs).toMatchInlineSnapshot(`
      Array [
        "DslCPaclSHTM-ROKf5-EXZLY-ExqPbmYTxYoRA",
      ]
    `);
  });
});

describe('given an update of a document with one existing and one non-existent reference with validation on', () => {
  let client;
  let updateResult;

  const referencedResourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const referencedDocumentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: [{ name: 'natural', value: 'update7' }],
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
    documentIdentity: [{ name: 'natural', value: 'update8' }],
  };
  const documentWithReferencesId = documentIdForDocumentInfo(documentWithReferencesResourceInfo, documentWithReferencesInfo);

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

    //  The document that will be referenced
    await upsertDocument(
      {
        ...newUpdateRequest(),
        id: referencedDocumentId,
        resourceInfo: referencedResourceInfo,
        documentInfo: referencedDocumentInfo,
      },
      client,
    );

    // The original document with no references
    await upsertDocument(
      {
        ...newUpdateRequest(),
        id: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validate: true,
      },
      client,
    );

    // The updated document with both valid and invalid references
    documentWithReferencesInfo.documentReferences = [validReference, invalidReference];
    updateResult = await updateDocumentById(
      {
        ...newUpdateRequest(),
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
    expect(updateResult.response).toBe('UPDATE_FAILURE_REFERENCE');
    expect(updateResult.failureMessage).toMatchInlineSnapshot(
      `"Reference validation failed: Resource School is missing identity [{\\"name\\":\\"natural\\",\\"value\\":\\"not a valid reference\\"}]"`,
    );
  });

  it('should not have updated the document with an invalid reference in the db', async () => {
    const refsResult: any = await client.query(retrieveReferencesByDocumentIdSql(documentWithReferencesId));

    const outRefs = refsResult.rows.map((ref) => ref.referenced_document_id);
    expect(outRefs).toHaveLength(0);
  });
});
