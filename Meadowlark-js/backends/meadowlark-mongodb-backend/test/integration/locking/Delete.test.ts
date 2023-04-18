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
  DocumentReference,
  UpsertRequest,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  DocumentUuid,
  MeadowlarkId,
  TraceId,
} from '@edfi/meadowlark-core';
import { ClientSession, Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument, meadowlarkDocumentFrom } from '../../../src/model/MeadowlarkDocument';
import {
  asUpsert,
  getDocumentCollection,
  getNewClient,
  onlyReturnId,
  writeLockReferencedDocuments,
} from '../../../src/repository/Db';
import {
  validateReferences,
  onlyReturnAliasIds,
  onlyDocumentsReferencing,
} from '../../../src/repository/ReferenceValidation';
import { upsertDocument } from '../../../src/repository/Upsert';
import { setupConfigForIntegration } from '../Config';

const documentUuid = '2edb604f-eab0-412c-a242-508d6529214d' as DocumentUuid;

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
const schoolDocumentId = meadowlarkIdForDocumentIdentity(schoolResourceInfo, schoolDocumentInfo.documentIdentity);

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
const academicWeekDocumentId = meadowlarkIdForDocumentIdentity(
  academicWeekResourceInfo,
  academicWeekDocumentInfo.documentIdentity,
);

const academicWeekDocument: MeadowlarkDocument = meadowlarkDocumentFrom(
  academicWeekResourceInfo,
  academicWeekDocumentInfo,
  documentUuid,
  academicWeekDocumentId,
  {},
  true,
  '',
);

describe('given a delete concurrent with an insert referencing the to-be-deleted document - using read lock scheme', () => {
  let client: MongoClient;

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);

    // Insert a School document - it will be referenced by an AcademicWeek document while being deleted
    await upsertDocument(
      { ...newUpsertRequest(), meadowlarkId: schoolDocumentId, documentInfo: schoolDocumentInfo },
      client,
    );

    // ----
    // Start transaction to insert an AcademicWeek - it references the School which will interfere with the School delete
    // ----
    const upsertSession: ClientSession = client.startSession();
    upsertSession.startTransaction();

    // Check for reference validation failures on AcademicWeek document - School is still there
    const upsertFailures = await validateReferences(
      academicWeekDocumentInfo.documentReferences,
      [],
      mongoCollection,
      upsertSession,
      '',
    );

    // Should be no reference validation failures for AcademicWeek document
    expect(upsertFailures).toHaveLength(0);

    // ***** Read-for-write lock the validated referenced documents in the insert
    // see https://www.mongodb.com/blog/post/how-to-select--for-update-inside-mongodb-transactions
    await writeLockReferencedDocuments(mongoCollection, academicWeekDocument.outboundRefs, upsertSession);

    // ----
    // Start transaction to delete the School document - interferes with the AcademicWeek insert referencing the School
    // ----
    const deleteSession: ClientSession = client.startSession();
    deleteSession.startTransaction();

    // Get the aliasIds for the School document, used to check for references to it as School or as EducationOrganization
    const deleteCandidate: any = await mongoCollection.findOne({ _id: schoolDocumentId }, onlyReturnAliasIds(deleteSession));

    // Check for any references to the School document
    const anyReferences = await mongoCollection.findOne(
      onlyDocumentsReferencing(deleteCandidate.aliasIds),
      onlyReturnId(deleteSession),
    );

    // Delete transaction sees no references yet, though we are about to add one
    expect(anyReferences).toBeNull();

    // Perform the insert of AcademicWeek document, adding a reference to to to-be-deleted document
    const { upsertedCount } = await mongoCollection.replaceOne(
      { _id: academicWeekDocumentId },
      academicWeekDocument,
      asUpsert(upsertSession),
    );

    // **** The insert of AcademicWeek document should have been successful
    expect(upsertedCount).toBe(1);

    // ----
    // End transaction to insert the AcademicWeek document
    // ----
    await upsertSession.commitTransaction();

    // Try deleting the School document - should fail thanks to AcademicWeek's read-for-write lock
    try {
      await mongoCollection.deleteOne({ _id: schoolDocumentId }, { session: deleteSession });
    } catch (e) {
      expect(e).toMatchInlineSnapshot(
        `[MongoServerError: WriteConflict error: this operation conflicted with another operation. Please retry your operation or multi-document transaction.]`,
      );
    }

    // ----
    // End transaction to delete the School document
    // ----
    await deleteSession.abortTransaction();
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await client.close();
  });

  it('should have still have the School document in the db - a success', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: schoolDocumentId });
    expect(result.documentIdentity.schoolId).toBe('123');
  });
});
