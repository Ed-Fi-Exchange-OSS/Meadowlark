// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/**
 * NOTE: If Postgres query transactions are modified to use SSI and the use of SELECT...FOR UPDATE/SHARE is removed,
 * this test case should be updated to adjust its logic and avoid deadlocks at the database level and some test will fail.
 */
import {
  DocumentInfo,
  NoDocumentInfo,
  newDocumentInfo,
  newSecurity,
  meadowlarkIdForDocumentIdentity,
  DocumentReference,
  UpsertRequest,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  getMeadowlarkIdForDocumentReference,
  MeadowlarkId,
  TraceId,
  DocumentUuid,
} from '@edfi/meadowlark-core';
import { PoolClient } from 'pg';
import { getSharedClient, resetSharedClient } from '../../../src/repository/Db';
import { validateReferences } from '../../../src/repository/ReferenceValidation';
import {
  findReferencingMeadowlarkIds,
  deleteAliasesForDocumentByMeadowlarkId,
  findDocumentByMeadowlarkId,
  insertDocument,
  findAliasMeadowlarkIdsForDocumentByMeadowlarkId,
  insertAlias,
  insertOutboundReferences,
  deleteDocumentRowByDocumentUuid,
} from '../../../src/repository/SqlHelper';
import { upsertDocument } from '../../../src/repository/Upsert';
import { deleteAll } from '../TestHelper';
import { MeadowlarkDocument, NoMeadowlarkDocument } from '../../../src/model/MeadowlarkDocument';

// A bunch of setup stuff
const newUpsertRequest = (): UpsertRequest => ({
  meadowlarkId: '' as MeadowlarkId,
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

const schoolResourceInfo: ResourceInfo = {
  ...newResourceInfo(),
  resourceName: 'School',
};

const schoolDocumentInfo: DocumentInfo = {
  ...newDocumentInfo(),
  documentIdentity: { schoolId: '123' },
};
const schoolMeadowlarkId = meadowlarkIdForDocumentIdentity(schoolResourceInfo, schoolDocumentInfo.documentIdentity);

const referenceToSchool: DocumentReference = {
  projectName: schoolResourceInfo.projectName,
  resourceName: schoolResourceInfo.resourceName,
  documentIdentity: schoolDocumentInfo.documentIdentity,
  isDescriptor: false,
};

const academicWeekResourceInfo: ResourceInfo = {
  ...newResourceInfo(),
  resourceName: 'AcademicWeek',
};
const academicWeekDocumentInfo: DocumentInfo = {
  ...newDocumentInfo(),
  documentIdentity: {
    schoolId: '123',
    weekIdentifier: '123456',
  },

  documentReferences: [referenceToSchool],
};
const academicWeekMeadowlarkId = meadowlarkIdForDocumentIdentity(
  academicWeekResourceInfo,
  academicWeekDocumentInfo.documentIdentity,
);

describe('given a delete concurrent with an insert referencing the to-be-deleted document - using read lock scheme', () => {
  let insertClient: PoolClient;
  let deleteClient: PoolClient;

  beforeAll(async () => {
    insertClient = (await getSharedClient()) as PoolClient;
    deleteClient = (await getSharedClient()) as PoolClient;
    let resultDocumentUuid: DocumentUuid;
    // Insert a School document - it will be referenced by an AcademicWeek document while being deleted
    const upsertResult = await upsertDocument(
      { ...newUpsertRequest(), meadowlarkId: schoolMeadowlarkId, documentInfo: schoolDocumentInfo },
      insertClient,
    );
    if (upsertResult.response === 'INSERT_SUCCESS') {
      resultDocumentUuid = upsertResult.newDocumentUuid;
    } else if (upsertResult.response === 'UPDATE_SUCCESS') {
      resultDocumentUuid = upsertResult.existingDocumentUuid;
    } else {
      resultDocumentUuid = '' as DocumentUuid;
    }
    // ----
    // Start transaction to insert an AcademicWeek - it references the School which will interfere with the School delete
    // ----
    // try {
    await insertClient.query('BEGIN');
    const outboundRefs = academicWeekDocumentInfo.documentReferences.map((dr: DocumentReference) =>
      getMeadowlarkIdForDocumentReference(dr),
    );

    // Check for reference validation failures on AcademicWeek document - This will also obtain a lock on the references
    // now allowing them to be deleted before this transaction completes
    const upsertFailures = await validateReferences(
      academicWeekDocumentInfo.documentReferences,
      [],
      outboundRefs,
      insertClient,
      '',
    );

    // // Should be no reference validation failures for AcademicWeek document
    expect(upsertFailures).toHaveLength(0);

    // ----
    // Start transaction to delete the School document - interferes with the AcademicWeek insert referencing the School
    // ----
    await deleteClient.query('BEGIN');

    try {
      // Get the alias ids for the document we're trying to delete, because the update transaction is trying
      // to use our school, this is where the code will throw a locking error. This is technically the last line
      // of code in this try block that should execute
      const aliasIdResult: MeadowlarkId[] = await findAliasMeadowlarkIdsForDocumentByMeadowlarkId(
        deleteClient,
        schoolMeadowlarkId,
      );

      const validDocMeadowlarkIds = aliasIdResult.map((ref) => ref);
      const referenceResult: MeadowlarkId[] = await findReferencingMeadowlarkIds(deleteClient, validDocMeadowlarkIds);
      const anyReferences: MeadowlarkId[] = referenceResult.filter((ref) => ref !== schoolMeadowlarkId);

      expect(anyReferences.length).toEqual(0);

      await deleteDocumentRowByDocumentUuid(deleteClient, resultDocumentUuid);
      await deleteAliasesForDocumentByMeadowlarkId(deleteClient, schoolMeadowlarkId);
      await deleteClient.query('COMMIT');
    } catch (e1) {
      await deleteClient.query('ROLLBACK');
      expect(e1.message.indexOf('could not obtain lock on row')).toBeGreaterThanOrEqual(0);
    }
    const documentUuid: DocumentUuid = '9ad5c9fa-82d1-494c-8d54-6aa1457f4364' as DocumentUuid;
    // Perform the insert of AcademicWeek document, adding a reference to to to-be-deleted document
    const insertResult = await insertDocument(insertClient, {
      meadowlarkId: academicWeekMeadowlarkId,
      documentUuid,
      resourceInfo: academicWeekResourceInfo,
      documentInfo: academicWeekDocumentInfo,
      edfiDoc: {},
      validateDocumentReferencesExist: true,
      security: newSecurity(),
      traceId: '' as TraceId,
    });
    // eslint-disable-next-line no-restricted-syntax
    for (const ref of outboundRefs) {
      await insertOutboundReferences(insertClient, academicWeekMeadowlarkId, ref as MeadowlarkId);
      await insertAlias(insertClient, documentUuid, academicWeekMeadowlarkId, ref as MeadowlarkId);
    }

    // **** The insert of AcademicWeek document should have been successful
    expect(insertResult).toEqual(true);

    // ----
    // End transaction to insert the AcademicWeek document
    // ----
    await insertClient.query('COMMIT');
    // } catch (e) {}
  });

  afterAll(async () => {
    await deleteAll(insertClient);
    insertClient.release();
    deleteClient.release();
    await resetSharedClient();
  });

  it('should have still have the School document in the db - a success', async () => {
    const docResult: MeadowlarkDocument = await findDocumentByMeadowlarkId(insertClient, schoolMeadowlarkId);
    expect(docResult.document_identity.schoolId).toBe('123');
  });
});

describe('given an insert concurrent with a delete referencing the to-be-deleted document - using read lock scheme', () => {
  let insertClient: PoolClient;
  let deleteClient: PoolClient;

  beforeAll(async () => {
    insertClient = (await getSharedClient()) as PoolClient;
    deleteClient = (await getSharedClient()) as PoolClient;

    // Insert a School document - it will be referenced by an AcademicWeek document while being deleted
    const upsertResult = await upsertDocument(
      {
        ...newUpsertRequest(),
        meadowlarkId: schoolMeadowlarkId,
        documentInfo: schoolDocumentInfo,
      },
      insertClient,
    );
    let resultDocumentUuid: DocumentUuid = '' as DocumentUuid;
    if (upsertResult.response === 'INSERT_SUCCESS') {
      resultDocumentUuid = upsertResult.newDocumentUuid;
    } else if (upsertResult.response === 'UPDATE_SUCCESS') {
      resultDocumentUuid = upsertResult.existingDocumentUuid;
    }
    // ----
    // Start transaction to insert an AcademicWeek - it references the School which will interfere with the School delete
    // ----
    await deleteClient.query('BEGIN');
    // Retrieve the alias ids for the school that we're trying to delete, this call will also
    // lock the school record so when we try to lock the records during the insert of the academic week
    // below it will fail
    const aliasIdResult: MeadowlarkId[] = await findAliasMeadowlarkIdsForDocumentByMeadowlarkId(
      deleteClient,
      schoolMeadowlarkId,
    );

    // The school is in the database
    expect(aliasIdResult.length).toEqual(1);

    // See if there are existing references to this document
    const validDocMeadowlarkIds = aliasIdResult.map((ref) => ref);
    const referenceResult: MeadowlarkId[] = await findReferencingMeadowlarkIds(deleteClient, validDocMeadowlarkIds);
    const anyReferences: MeadowlarkId[] = referenceResult.filter((ref) => ref !== schoolMeadowlarkId);

    expect(anyReferences.length).toEqual(0);

    // Delete the document
    await deleteDocumentRowByDocumentUuid(deleteClient, resultDocumentUuid);
    await deleteAliasesForDocumentByMeadowlarkId(deleteClient, schoolMeadowlarkId);

    // Start the insert
    await insertClient.query('BEGIN');

    const outboundRefs = academicWeekDocumentInfo.documentReferences.map((dr: DocumentReference) =>
      getMeadowlarkIdForDocumentReference(dr),
    );

    try {
      // Check for validation issues. This will lock all documents that this document references, so this is
      // what will fail when it can't get a lock on the school document, nothing beyond the validateReferences
      // call in try block will execute
      const upsertFailures = await validateReferences(
        academicWeekDocumentInfo.documentReferences,
        [],
        outboundRefs,
        insertClient,
        '',
      );

      // Should be no reference validation failures for AcademicWeek document
      expect(upsertFailures).toHaveLength(0);
      const documentUuid: DocumentUuid = '9ad5c9fa-82d1-494c-8d54-6aa1457f4365' as DocumentUuid;
      const insertResult = await insertDocument(insertClient, {
        meadowlarkId: academicWeekMeadowlarkId,
        documentUuid,
        resourceInfo: academicWeekResourceInfo,
        documentInfo: academicWeekDocumentInfo,
        edfiDoc: {},
        validateDocumentReferencesExist: true,
        security: newSecurity(),
        traceId: '' as TraceId,
      });
      expect(insertResult).toEqual(true);
      // eslint-disable-next-line no-restricted-syntax
      for (const ref of outboundRefs) {
        await insertOutboundReferences(insertClient, academicWeekMeadowlarkId, ref as MeadowlarkId);
        await insertAlias(insertClient, documentUuid, academicWeekMeadowlarkId, ref as MeadowlarkId);
      }
      await insertClient.query('COMMIT');
    } catch (e1) {
      await insertClient.query('ROLLBACK');
      expect(e1.message.indexOf('could not obtain lock on row')).toBeGreaterThanOrEqual(0);
    }

    // Commit the delete of the school
    await deleteClient.query('COMMIT');
  });

  afterAll(async () => {
    await deleteAll(insertClient);
    insertClient.release();
    deleteClient.release();
    await resetSharedClient();
  });

  it('should not have either document in the db', async () => {
    const schoolDocResult: MeadowlarkDocument = await findDocumentByMeadowlarkId(insertClient, schoolMeadowlarkId);
    const academicWeekDocResult: MeadowlarkDocument = await findDocumentByMeadowlarkId(
      insertClient,
      academicWeekMeadowlarkId,
    );
    expect(schoolDocResult).toBe(NoMeadowlarkDocument);
    expect(academicWeekDocResult).toBe(NoMeadowlarkDocument);
  });
});
