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
  UpsertRequest,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  DocumentReference,
  newSuperclassInfo,
  SuperclassInfo,
  DeleteResult,
  MeadowlarkId,
  DocumentUuid,
  TraceId,
  generateDocumentUuid,
  UpsertResult,
} from '@edfi/meadowlark-core';
import type { PoolClient } from 'pg';
import { deleteAll, retrieveReferencesByMeadowlarkIdSql } from './TestHelper';
import { getSharedClient, resetSharedClient } from '../../src/repository/Db';
import { deleteDocumentByDocumentUuid } from '../../src/repository/Delete';
import { upsertDocument } from '../../src/repository/Upsert';
import {
  findAliasMeadowlarkIdsForDocumentByMeadowlarkId,
  findDocumentByDocumentUuid,
  findDocumentByMeadowlarkId,
  findReferencingMeadowlarkIds,
} from '../../src/repository/SqlHelper';
import { MeadowlarkDocument, NoMeadowlarkDocument } from '../../src/model/MeadowlarkDocument';

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
  documentUuid: '4ba39884-3f5e-40fa-be60-9f92b96608fc' as DocumentUuid,
  resourceInfo: NoResourceInfo,
  validateNoReferencesToDocument: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

describe('given the delete of a non-existent document', () => {
  let client: PoolClient;
  let deleteResult: DeleteResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };

  const documentUuid = generateDocumentUuid();

  beforeAll(async () => {
    client = await getSharedClient();

    deleteResult = await deleteDocumentByDocumentUuid(
      { ...newDeleteRequest(), documentUuid, resourceInfo, validateNoReferencesToDocument: false },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should return delete failure', async () => {
    expect(deleteResult.response).toBe('DELETE_FAILURE_NOT_EXISTS');
  });
});

describe('given the delete of an existing document', () => {
  let client: PoolClient;
  let deleteResult: DeleteResult;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'delete2' },
  };
  const documentUuid = generateDocumentUuid();
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    client = await getSharedClient();
    const upsertRequest: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      documentInfo,
      edfiDoc: { natural: 'key' },
    };
    // insert the initial version
    const upsertResult: UpsertResult = await upsertDocument(upsertRequest, client);
    const upsertDocumentUuid: DocumentUuid =
      upsertResult.response === 'INSERT_SUCCESS' ? upsertResult?.newDocumentUuid : ('' as DocumentUuid);
    deleteResult = await deleteDocumentByDocumentUuid(
      { ...newDeleteRequest(), documentUuid: upsertDocumentUuid, resourceInfo },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should return delete success', async () => {
    expect(deleteResult.response).toBe('DELETE_SUCCESS');
  });

  it('should have deleted the document in the db', async () => {
    const result: MeadowlarkDocument = await findDocumentByDocumentUuid(client, documentUuid);
    expect(result).toBe(NoMeadowlarkDocument);
  });
});

describe('given an delete of a document referenced by an existing document with validation on', () => {
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
    documentIdentity: { natural: 'delete6' },
    documentReferences: [validReference],
  };
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

    // The document that will be referenced
    const referencedUpsertResult: UpsertResult = await upsertDocument(
      { ...newUpsertRequest(), meadowlarkId: referencedDocumentId, documentInfo: referencedDocumentInfo },
      client,
    );

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
    const referencedDocumentUuid: DocumentUuid =
      referencedUpsertResult.response === 'INSERT_SUCCESS' ? referencedUpsertResult?.newDocumentUuid : ('' as DocumentUuid);
    deleteResult = await deleteDocumentByDocumentUuid(
      {
        ...newDeleteRequest(),
        documentUuid: referencedDocumentUuid,
        resourceInfo: referencedResourceInfo,
        validateNoReferencesToDocument: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should have returned delete failure due to existing reference', async () => {
    expect(deleteResult.response).toBe('DELETE_FAILURE_REFERENCE');
  });

  it('should still have the referenced document in the db', async () => {
    const docResult: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, referencedDocumentId);
    expect(docResult.document_identity.natural).toBe('delete5');
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
    resourceName: 'School',
  };
  const documentWithReferencesInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'delete16' },
    documentReferences: [validReference],
  };
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

    // The document that will be referenced
    await upsertDocument(
      { ...newUpsertRequest(), meadowlarkId: referencedDocumentId, documentInfo: referencedDocumentInfo },
      client,
    );

    // The referencing document that will be deleted
    const documentWithReferenceUpsertResult: UpsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesMeadowlarkId,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
    const documentWithReferencesDocumentUuid: DocumentUuid =
      documentWithReferenceUpsertResult.response === 'INSERT_SUCCESS'
        ? documentWithReferenceUpsertResult?.newDocumentUuid
        : ('' as DocumentUuid);
    deleteResult = await deleteDocumentByDocumentUuid(
      {
        ...newDeleteRequest(),
        documentUuid: documentWithReferencesDocumentUuid,
        resourceInfo: documentWithReferencesResourceInfo,
        validateNoReferencesToDocument: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should return delete success', async () => {
    expect(deleteResult.response).toBe('DELETE_SUCCESS');
  });

  it('should have deleted the document in the db', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, documentWithReferencesMeadowlarkId);

    expect(result).toBe(NoMeadowlarkDocument);
  });

  it('should have deleted the document alias in the db', async () => {
    const result: MeadowlarkId[] = await findAliasMeadowlarkIdsForDocumentByMeadowlarkId(
      client,
      documentWithReferencesMeadowlarkId,
    );

    expect(result.length).toEqual(0);
  });
  it('should have deleted the document reference in the db', async () => {
    const result: MeadowlarkId[] = await findReferencingMeadowlarkIds(client, [referencedDocumentId]);

    expect(result.length).toEqual(0);
  });
});

describe('given an delete of a document referenced by an existing document with validation off', () => {
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
    documentIdentity: { natural: 'delete6' },
    documentReferences: [validReference],
  };
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferencesResourceInfo,
    documentWithReferencesInfo.documentIdentity,
  );

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;

    // The document that will be referenced
    const referencedDocumentUpsertResult: UpsertResult = await upsertDocument(
      { ...newUpsertRequest(), meadowlarkId: referencedDocumentId, documentInfo: referencedDocumentInfo },
      client,
    );

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
    const referencedDocumentUuid: DocumentUuid =
      referencedDocumentUpsertResult.response === 'INSERT_SUCCESS'
        ? referencedDocumentUpsertResult?.newDocumentUuid
        : ('' as DocumentUuid);
    deleteResult = await deleteDocumentByDocumentUuid(
      {
        ...newDeleteRequest(),
        documentUuid: referencedDocumentUuid,
        resourceInfo: referencedResourceInfo,
        validateNoReferencesToDocument: false,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should have returned delete success', async () => {
    expect(deleteResult.response).toBe('DELETE_SUCCESS');
  });

  it('should not have the referenced document in the db', async () => {
    const docResult: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, referencedDocumentId);
    expect(docResult).toBe(NoMeadowlarkDocument);
  });

  it('should not be the parent document in the references table', async () => {
    const docResult: any = await client.query(retrieveReferencesByMeadowlarkIdSql(referencedDocumentId));
    expect(docResult.rowCount).toEqual(0);
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
    documentIdentity: { week: 'delete6' },
    documentReferences: [referenceAsSuperclass],
  };
  const documentWithReferencesMeadowlarkId = meadowlarkIdForDocumentIdentity(
    documentWithReferenceResourceInfo,
    documentWithReferenceDocumentInfo.documentIdentity,
  );

  beforeAll(async () => {
    client = (await getSharedClient()) as PoolClient;
    // The document that will be referenced
    const referencedDocumentUpsertResult: UpsertResult = await upsertDocument(
      { ...newUpsertRequest(), meadowlarkId: referencedDocumentId, documentInfo: referencedDocumentInfo },
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
    let referencedDocumentUuid: DocumentUuid = '' as DocumentUuid;
    if (referencedDocumentUpsertResult.response === 'INSERT_SUCCESS') {
      referencedDocumentUuid = referencedDocumentUpsertResult.newDocumentUuid;
    } else if (referencedDocumentUpsertResult.response === 'UPDATE_SUCCESS') {
      referencedDocumentUuid = referencedDocumentUpsertResult.existingDocumentUuid;
    }

    deleteResult = await deleteDocumentByDocumentUuid(
      {
        ...newDeleteRequest(),
        documentUuid: referencedDocumentUuid,
        resourceInfo: referencedResourceInfo,
        validateNoReferencesToDocument: true,
      },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should have returned delete failure due to existing reference', async () => {
    expect(deleteResult.response).toBe('DELETE_FAILURE_REFERENCE');
  });

  it('should still have the referenced document in the db', async () => {
    const result: MeadowlarkDocument = await findDocumentByMeadowlarkId(client, referencedDocumentId);
    expect(result.document_identity.schoolId).toBe('123');
  });
});
