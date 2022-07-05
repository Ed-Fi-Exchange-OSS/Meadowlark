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
  DocumentReference,
  UpsertRequest,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
} from '@edfi/meadowlark-core';
import { ClientSession, Collection, MongoClient, ObjectId } from 'mongodb';
import { MeadowlarkDocument, meadowlarkDocumentFrom } from '../../../src/model/MeadowlarkDocument';
import { getCollection, getNewClient } from '../../../src/repository/Db';
import {
  validateReferences,
  asUpsert,
  onlyReturnExistenceIds,
  onlyDocumentsReferencing,
  onlyReturnId,
} from '../../../src/repository/ReferenceValidation';
import { upsertDocument } from '../../../src/repository/Upsert';

jest.setTimeout(10000);

// A bunch of setup stuff
const newUpsertRequest = (): UpsertRequest => ({
  id: '',
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validate: false,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

const schoolResourceInfo: ResourceInfo = {
  ...newResourceInfo(),
  resourceName: 'School',
};

const schoolDocumentInfo: DocumentInfo = {
  ...newDocumentInfo(),
  documentIdentity: [{ name: 'schoolId', value: '123' }],
};
const schoolDocumentId = documentIdForDocumentInfo(schoolResourceInfo, schoolDocumentInfo);

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
  documentIdentity: [
    { name: 'schoolId', value: '123' },
    { name: 'weekIdentifier', value: '1' },
  ],
  documentReferences: [referenceToSchool],
};
const academicWeekDocumentId = documentIdForDocumentInfo(academicWeekResourceInfo, academicWeekDocumentInfo);

const academicWeekDocument: MeadowlarkDocument = meadowlarkDocumentFrom(
  academicWeekResourceInfo,
  academicWeekDocumentInfo,
  academicWeekDocumentId,
  {},
  true,
  '',
);

describe('given a delete document transaction concurrent with an insert document referencing the delete - without a read for write lock ', () => {
  let client: MongoClient;

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    const mongoCollection: Collection<MeadowlarkDocument> = getCollection(client);

    // Insert a School document - it will be referenced by an AcademicWeek document while being deleted
    await upsertDocument({ ...newUpsertRequest(), id: schoolDocumentId, documentInfo: schoolDocumentInfo }, client);

    // ----
    // Start transaction to insert an AcademicWeek - it references the School which will interfere with the School delete
    // ----
    const upsertSession: ClientSession = client.startSession();
    upsertSession.startTransaction();

    // Check for reference validation failures on AcademicWeek document - School is still there
    const upsertFailures = await validateReferences(
      academicWeekDocumentInfo.documentReferences,
      [],
      academicWeekDocument.outRefs,
      mongoCollection,
      upsertSession,
      '',
    );

    // Should be no reference validation failures for AcademicWeek document
    expect(upsertFailures).toHaveLength(0);

    // ----
    // Start transaction to delete the School document - it interferes with the AcademicWeek insert referencing the School
    // ----
    const deleteSession: ClientSession = client.startSession();
    deleteSession.startTransaction();

    // Get the existenceIds for the School document, used to check for references to it as School or as EducationOrganization
    const deleteCandidate: any = await mongoCollection.findOne(
      { _id: schoolDocumentId },
      onlyReturnExistenceIds(deleteSession),
    );

    // Check for any references to the School document
    const anyReferences = await mongoCollection.findOne(
      onlyDocumentsReferencing(deleteCandidate.existenceIds),
      onlyReturnId(deleteSession),
    );

    expect(anyReferences).toBeNull();

    // Delete the School document
    const { deletedCount } = await mongoCollection.deleteOne({ _id: schoolDocumentId }, { session: deleteSession });

    expect(deletedCount).toBe(1);

    // ----
    // End transaction to delete the School document
    // ----
    deleteSession.commitTransaction();

    // Perform the insert of AcademicWeek document
    const { upsertedCount } = await mongoCollection.replaceOne(
      { _id: academicWeekDocumentId },
      academicWeekDocument,
      asUpsert(upsertSession),
    );

    // **** The insert of AcademicWeek document should NOT have be successful - but was
    expect(upsertedCount).toBe(1);

    // ----
    // End transaction to insert the AcademicWeek document
    // ----
    upsertSession.commitTransaction();
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('deleted the School document in the db anyway, this is a failed reference validation implementation!', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ _id: schoolDocumentId });
    expect(result).toBeNull();
  });
});

describe('given a delete concurrent with an insert referencing the to-be-deleted document - using read lock scheme', () => {
  let client: MongoClient;

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    const mongoDocuments: Collection<MeadowlarkDocument> = getCollection(client);

    // Insert a School document - it will be referenced by an AcademicWeek document while being deleted
    await upsertDocument({ ...newUpsertRequest(), id: schoolDocumentId, documentInfo: schoolDocumentInfo }, client);

    // ----
    // Start transaction to insert an AcademicWeek - it references the School which will interfere with the School delete
    // ----
    const upsertSession: ClientSession = client.startSession();
    upsertSession.startTransaction();

    // Check for reference validation failures on AcademicWeek document - School is still there
    const upsertFailures = await validateReferences(
      academicWeekDocumentInfo.documentReferences,
      [],
      academicWeekDocument.outRefs,
      mongoDocuments,
      upsertSession,
      '',
    );

    // Should be no reference validation failures for AcademicWeek document
    expect(upsertFailures).toHaveLength(0);

    // ***** Read-for-write lock the validated referenced documents in the insert
    // see https://www.mongodb.com/blog/post/how-to-select--for-update-inside-mongodb-transactions
    mongoDocuments.updateMany(
      { existenceIds: { $in: academicWeekDocument.outRefs } },
      { $set: { lock: new ObjectId() } },
      { session: upsertSession },
    );

    // ----
    // Start transaction to delete the School document - interferes with the AcademicWeek insert referencing the School
    // ----
    const deleteSession: ClientSession = client.startSession();
    deleteSession.startTransaction();

    // Get the existenceIds for the School document, used to check for references to it as School or as EducationOrganization
    const deleteCandidate: any = await mongoDocuments.findOne(
      { _id: schoolDocumentId },
      onlyReturnExistenceIds(deleteSession),
    );

    // Check for any references to the School document
    const anyReferences = await mongoDocuments.findOne(
      onlyDocumentsReferencing(deleteCandidate.existenceIds),
      onlyReturnId(deleteSession),
    );

    // Delete transaction sees no references yet, though we are about to add one
    expect(anyReferences).toBeNull();

    // Perform the insert of AcademicWeek document, adding a reference to to to-be-deleted document
    const { upsertedCount } = await mongoDocuments.replaceOne(
      { _id: academicWeekDocumentId },
      academicWeekDocument,
      asUpsert(upsertSession),
    );

    // **** The insert of AcademicWeek document should have been successful
    expect(upsertedCount).toBe(1);

    // ----
    // End transaction to insert the AcademicWeek document
    // ----
    upsertSession.commitTransaction();

    // Try deleting the School document - should fail thanks to AcademicWeek's read-for-write lock
    try {
      await mongoDocuments.deleteOne({ _id: schoolDocumentId }, { session: deleteSession });
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`[MongoServerError: WriteConflict]`);
    }

    // ----
    // End transaction to delete the School document
    // ----
    deleteSession.abortTransaction();
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('should have still have the School document in the db - a success', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ _id: schoolDocumentId });
    expect(result.documentIdentity).toHaveLength(1);
    expect(result.documentIdentity[0].name).toBe('schoolId');
    expect(result.documentIdentity[0].value).toBe('123');
  });
});
