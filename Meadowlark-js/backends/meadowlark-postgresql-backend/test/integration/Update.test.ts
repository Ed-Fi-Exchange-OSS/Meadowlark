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
  GetResult,
  GetRequest,
  UpdateResult,
  SuperclassInfo,
  newSuperclassInfo,
  MeadowlarkId,
  DocumentUuid,
  TraceId,
  UpsertRequest,
  UpsertResult,
} from '@edfi/meadowlark-core';
import format from 'pg-format';
import type { PoolClient } from 'pg';
import { resetSharedClient, getSharedClient } from '../../src/repository/Db';
import { updateDocumentByDocumentUuid } from '../../src/repository/Update';
import { upsertDocument } from '../../src/repository/Upsert';
import { deleteAll, retrieveReferencesByMeadowlarkIdSql, verifyAliasId } from './TestHelper';
import { getDocumentByDocumentUuid } from '../../src/repository/Get';
import {
  findAliasIdsForDocumentByMeadowlarkIdSql,
  findDocumentByDocumentUuidSql,
  findDocumentByMeadowlarkIdSql,
} from '../../src/repository/SqlHelper';

const documentUuid: DocumentUuid = 'feb82f3e-3685-4868-86cf-f4b91749a799' as DocumentUuid;
let resultDocumentUuid: DocumentUuid;

const newUpsertRequest = (): UpsertRequest => ({
  meadowlarkId: '' as MeadowlarkId,
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

const newUpdateRequest = (): UpdateRequest => ({
  meadowlarkId: '' as MeadowlarkId,
  documentUuid,
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

const newGetRequest = (): GetRequest => ({
  documentUuid,
  resourceInfo: NoResourceInfo,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
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
    documentIdentity: { natural: 'update1' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    client = await getSharedClient();
    const nonExistentDocumentUuid: DocumentUuid = '00000000-0000-0000-0000-000000000000' as DocumentUuid;
    updateResult = await updateDocumentByDocumentUuid(
      {
        ...newUpdateRequest(),
        documentUuid: nonExistentDocumentUuid,
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

  it('should not exist in the db', async () => {
    const result: GetResult = await getDocumentByDocumentUuid({ ...newGetRequest(), documentUuid }, client);

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
    documentIdentity: { natural: 'update2' },
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);

  beforeAll(async () => {
    client = await getSharedClient();
    const upsertRequest: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo,
      edfiDoc: { natural: 'key' },
    };
    const updateRequest: UpdateRequest = {
      ...newUpdateRequest(),
      documentUuid,
      meadowlarkId,
      resourceInfo,
      documentInfo,
      edfiDoc: { natural: 'key' },
    };

    // insert the initial version
    const upsertResult: UpsertResult = await upsertDocument(upsertRequest, client);
    if (upsertResult.response === 'INSERT_SUCCESS') {
      resultDocumentUuid = upsertResult.newDocumentUuid;
    } else if (upsertResult.response === 'UPDATE_SUCCESS') {
      resultDocumentUuid = upsertResult.existingDocumentUuid;
    } else {
      resultDocumentUuid = '' as DocumentUuid;
    }
    updateResult = await updateDocumentByDocumentUuid(
      { ...updateRequest, documentUuid: resultDocumentUuid, edfiDoc: { changeToDoc: true } },
      client,
    );
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should return update success', async () => {
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document in the db', async () => {
    const result: any = await client.query(findDocumentByDocumentUuidSql(resultDocumentUuid));

    expect(result.rows[0].document_identity.natural).toBe('update2');

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
    client = await getSharedClient();

    // Insert the original document with no reference
    const upsertResult: UpsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: false,
      },
      client,
    );
    const upsertDocumentUuid: DocumentUuid =
      upsertResult.response === 'INSERT_SUCCESS' ? upsertResult?.newDocumentUuid : ('' as DocumentUuid);
    // Update the document with an invalid reference
    documentWithReferencesInfo.documentReferences = [invalidReference];
    updateResult = await updateDocumentByDocumentUuid(
      {
        ...newUpdateRequest(),
        documentUuid: upsertDocumentUuid,
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
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with an invalid reference in the db', async () => {
    const docResult: any = await client.query(findDocumentByMeadowlarkIdSql(documentWithReferencesId));
    const refsResult: any = await client.query(retrieveReferencesByMeadowlarkIdSql(documentWithReferencesId));

    const outboundRefs = refsResult.rows.map((ref) => ref.referenced_document_id);

    expect(docResult.rows[0].document_identity.natural).toBe('update4');

    expect(outboundRefs).toMatchInlineSnapshot(`
      [
        "QtykK4uDYZK7VOChNxRsMDtOcAu6a0oe9ozl2Q",
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
    documentIdentity: { natural: 'update5' },
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
    documentIdentity: { natural: 'update6' },
  };
  const documentWithReferencesId = meadowlarkIdForDocumentIdentity(
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
    const upsertResult: UpsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
    const upsertDocumentUuid: DocumentUuid =
      upsertResult.response === 'INSERT_SUCCESS' ? upsertResult?.newDocumentUuid : ('' as DocumentUuid);
    // The updated document with a valid reference
    documentWithReferencesInfo.documentReferences = [validReference];
    updateResult = await updateDocumentByDocumentUuid(
      {
        ...newUpdateRequest(),
        meadowlarkId: documentWithReferencesId,
        documentUuid: upsertDocumentUuid,
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
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference in the db', async () => {
    const docResult: any = await client.query(findDocumentByMeadowlarkIdSql(documentWithReferencesId));
    const refsResult: any = await client.query(retrieveReferencesByMeadowlarkIdSql(documentWithReferencesId));

    const outboundRefs = refsResult.rows.map((ref) => ref.referenced_document_id);
    expect(docResult.rows[0].document_identity.natural).toBe('update6');
    expect(outboundRefs).toMatchInlineSnapshot(`
      [
        "Qw5FvPdKxAXWnGghsMh3I61yLFfls4Q949Fk2w",
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
    documentIdentity: { natural: 'update7' },
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
    documentIdentity: { natural: 'update8' },
  };
  const documentWithReferencesId = meadowlarkIdForDocumentIdentity(
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
    const upsertResult: UpsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferencesResourceInfo,
        documentInfo: documentWithReferencesInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
    const upsertDocumentUuid: DocumentUuid =
      upsertResult.response === 'INSERT_SUCCESS' ? upsertResult?.newDocumentUuid : ('' as DocumentUuid);
    // The updated document with both valid and invalid references
    documentWithReferencesInfo.documentReferences = [validReference, invalidReference];
    updateResult = await updateDocumentByDocumentUuid(
      {
        ...newUpdateRequest(),
        meadowlarkId: documentWithReferencesId,
        documentUuid: upsertDocumentUuid,
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
    expect(updateResult.response).toBe('UPDATE_FAILURE_REFERENCE');
    expect(updateResult.failureMessage).toMatchInlineSnapshot(`
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
    const refsResult: any = await client.query(retrieveReferencesByMeadowlarkIdSql(documentWithReferencesId));

    const outboundRefs = refsResult.rows.map((ref) => ref.referenced_document_id);
    expect(outboundRefs).toHaveLength(0);
  });
});

describe('given an update of a subclass document referenced by an existing document as a superclass', () => {
  let client;
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
  };
  const documentWithReferencesId = meadowlarkIdForDocumentIdentity(
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
    const upsertResult: UpsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: documentWithReferencesId,
        resourceInfo: documentWithReferenceResourceInfo,
        documentInfo: documentWithReferenceDocumentInfo,
        validateDocumentReferencesExist: true,
      },
      client,
    );
    const upsertDocumentUuid: DocumentUuid =
      upsertResult.response === 'INSERT_SUCCESS' ? upsertResult?.newDocumentUuid : ('' as DocumentUuid);
    // The updated document with reference as superclass
    documentWithReferenceDocumentInfo.documentReferences = [referenceAsSuperclass];
    updateResult = await updateDocumentByDocumentUuid(
      {
        ...newUpdateRequest(),
        meadowlarkId: documentWithReferencesId,
        documentUuid: upsertDocumentUuid,
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
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have updated the document with a valid reference to superclass in the db', async () => {
    const result: any = await client.query(verifyAliasId(referencedMeadowlarkId));
    const outboundRefs = result.rows.map((row) => row.alias_id);
    expect(outboundRefs).toMatchInlineSnapshot(`
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
    client = (await getSharedClient()) as PoolClient;
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
    updateResult = await updateDocumentByDocumentUuid({ ...updateRequest, edfiDoc: { changeToDoc: true } }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should return update error', async () => {
    expect(updateResult.response).toBe('UPDATE_FAILURE_IMMUTABLE_IDENTITY');
  });
});

describe('given the update of an existing document changing meadowlarkId with allowIdentityUpdates true,', () => {
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

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School Identity update',
    allowIdentityUpdates: true,
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'updated identity allow identity updates' },
    documentReferences: [validReference],
  };
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);
  const documentInfoUpdated: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'update 2' },
    documentReferences: [validReference],
  };
  const meadowlarkIdUpdated = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfoUpdated.documentIdentity);

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

    const upsertRequest: UpsertRequest = {
      ...newUpsertRequest(),
      meadowlarkId,
      resourceInfo,
      documentInfo,
      edfiDoc: { natural: 'key upsert' },
      validateDocumentReferencesExist: true,
    };

    // insert the initial version
    upsertResult = await upsertDocument(upsertRequest, client);
    let upsertDocumentUuid: DocumentUuid = '' as DocumentUuid;
    if (upsertResult.response === 'INSERT_SUCCESS') {
      upsertDocumentUuid = upsertResult.newDocumentUuid;
    } else if (upsertResult.response === 'UPDATE_SUCCESS') {
      upsertResult.existingDocumentUuid;
    } else {
      throw new Error();
    }
    const updateRequest: UpdateRequest = {
      ...newUpdateRequest(),
      meadowlarkId: meadowlarkIdUpdated,
      documentUuid: upsertDocumentUuid,
      resourceInfo,
      documentInfo: documentInfoUpdated,
      edfiDoc: { natural: 'key' },
      validateDocumentReferencesExist: true,
    };
    // change document identity
    updateResult = await updateDocumentByDocumentUuid({ ...updateRequest, edfiDoc: { changeToDoc: true } }, client);
  });

  afterAll(async () => {
    await deleteAll(client);
    client.release();
    await resetSharedClient();
  });

  it('should return update success', async () => {
    expect(updateResult.response).toBe('UPDATE_SUCCESS');
  });

  it('should have deleted the document alias related to the old meadowlarkId in the db', async () => {
    const result: any = await client.query(findAliasIdsForDocumentByMeadowlarkIdSql(meadowlarkId));

    expect(result.rowCount).toEqual(0);
  });
  it('should have deleted the document reference  related to the old meadowlarkId in the db', async () => {
    const findParentReferenceByMeadowlarkIdSql = format(
      `SELECT alias_id FROM meadowlark.aliases WHERE document_id = %L FOR SHARE NOWAIT`,
      meadowlarkId,
    );
    const result: any = await client.query(findParentReferenceByMeadowlarkIdSql);

    expect(result.rowCount).toEqual(0);
  });
});
