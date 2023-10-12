// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DocumentInfo,
  newDocumentInfo,
  newSecurity,
  meadowlarkIdForDocumentIdentity,
  DocumentReference,
  UpsertRequest,
  NoResourceInfo,
  ResourceInfo,
  newResourceInfo,
  DocumentUuid,
  TraceId,
} from '@edfi/meadowlark-core';
import { ClientSession, Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument, meadowlarkDocumentFrom } from '../../../src/model/MeadowlarkDocument';
import {
  asUpsert,
  getConcurrencyCollection,
  getDocumentCollection,
  getNewClient,
  onlyReturnId,
  insertMeadowlarkIdOnConcurrencyCollection,
} from '../../../src/repository/Db';
import {
  validateReferences,
  onlyReturnAliasIds,
  onlyDocumentsReferencing,
} from '../../../src/repository/ReferenceValidation';
import { upsertDocument } from '../../../src/repository/Upsert';
import { setupConfigForIntegration } from '../Config';
import { ConcurrencyDocument } from '../../../src/model/ConcurrencyDocument';

jest.setTimeout(120_000);

const documentUuid = '2edb604f-eab0-412c-a242-508d6529214d' as DocumentUuid;

// A bunch of setup stuff
const edfiSchoolDoc = {
  schoolId: 123,
  nameOfInstitution: 'A School 123',
  educationOrganizationCategories: [
    {
      educationOrganizationCategoryDescriptor: 'uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other',
    },
  ],
  schoolCategories: [
    {
      schoolCategoryDescriptor: 'uri://ed-fi.org/SchoolCategoryDescriptor#All Levels',
    },
  ],
  gradeLevels: [
    {
      gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#First Grade',
    },
  ],
};

const schoolResourceInfo: ResourceInfo = {
  ...newResourceInfo(),
  resourceName: 'School',
};

const schoolDocumentInfo: DocumentInfo = {
  ...newDocumentInfo(),
  documentIdentity: { schoolId: '123' },
};

const schoolMeadowlarkId = meadowlarkIdForDocumentIdentity(schoolResourceInfo, schoolDocumentInfo.documentIdentity);

const newUpsertRequest = (): UpsertRequest => ({
  meadowlarkId: schoolMeadowlarkId,
  resourceInfo: NoResourceInfo,
  documentInfo: schoolDocumentInfo,
  edfiDoc: edfiSchoolDoc,
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

const referenceToSchool: DocumentReference = {
  projectName: schoolResourceInfo.projectName,
  resourceName: schoolResourceInfo.resourceName,
  documentIdentity: schoolDocumentInfo.documentIdentity,
  isDescriptor: false,
};

const schoolDocument: MeadowlarkDocument = meadowlarkDocumentFrom({
  resourceInfo: schoolResourceInfo,
  documentInfo: schoolDocumentInfo,
  documentUuid,
  meadowlarkId: schoolMeadowlarkId,
  edfiDoc: edfiSchoolDoc,
  validate: true,
  createdBy: '',
  createdAt: Date.now(),
  lastModifiedAt: Date.now(),
});

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

const academicWeekDocument: MeadowlarkDocument = meadowlarkDocumentFrom({
  resourceInfo: academicWeekResourceInfo,
  documentInfo: academicWeekDocumentInfo,
  documentUuid,
  meadowlarkId: academicWeekMeadowlarkId,
  edfiDoc: {},
  validate: true,
  createdBy: '',
  createdAt: Date.now(),
  lastModifiedAt: Date.now(),
});

describe('given an upsert (update) concurrent with an insert referencing the to-be-updated document - using materialized conflict approach', () => {
  let client: MongoClient;

  beforeAll(async () => {
    await setupConfigForIntegration();

    client = (await getNewClient()) as MongoClient;
    const mongoDocumentCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const mongoConcurrencyCollection: Collection<ConcurrencyDocument> = getConcurrencyCollection(client);

    // Insert a School document - it will be referenced by an AcademicWeek document while being updated
    await upsertDocument({ ...newUpsertRequest() }, client);

    // ----
    // Start transaction to insert an AcademicWeek - it references the School which will interfere with the School update
    // ----
    const upsertSession: ClientSession = client.startSession();
    upsertSession.startTransaction();

    // Check for reference validation failures on AcademicWeek document - School is still there
    const upsertFailures = await validateReferences(
      academicWeekDocumentInfo.documentReferences,
      [],
      mongoDocumentCollection,
      upsertSession,
      '',
    );

    // Should be no reference validation failures for AcademicWeek document
    expect(upsertFailures).toHaveLength(0);

    // ***** Read-for-write lock the validated referenced documents in the insert
    // see https://www.mongodb.com/blog/post/how-to-select--for-update-inside-mongodb-transactions
    // await writeLockReferencedDocuments(mongoDocumentCollection, academicWeekDocument.outboundRefs, upsertSession);

    // ----
    // Start transaction to update the School document - interferes with the AcademicWeek insert referencing the School
    // ----
    const updateSession: ClientSession = client.startSession();
    updateSession.startTransaction();

    // Get the aliasMeadowlarkIds for the School document, used to check for references to it as School or as EducationOrganization
    const udpateCandidate: any = await mongoDocumentCollection.findOne(
      { _id: schoolMeadowlarkId },
      onlyReturnAliasIds(updateSession),
    );

    // Check for any references to the School document
    const anyReferences = await mongoDocumentCollection.findOne(
      onlyDocumentsReferencing(udpateCandidate.aliasMeadowlarkIds),
      onlyReturnId(updateSession),
    );

    // Update transaction sees no references yet, though we are about to add one
    expect(anyReferences).toBeNull();

    // Perform the insert of AcademicWeek document, adding a reference to to to-be-updated document
    const { upsertedCount } = await mongoDocumentCollection.replaceOne(
      { _id: academicWeekMeadowlarkId },
      academicWeekDocument,
      asUpsert(upsertSession),
    );

    // **** The insert of AcademicWeek document should have been successful
    expect(upsertedCount).toBe(1);

    // RND-644
    // Adds the academic week and the, to be updated, school to the concurrency collection.
    const concurrencyDocumentsAcademicWeek: ConcurrencyDocument[] = [];
    concurrencyDocumentsAcademicWeek.push({ meadowlarkId: academicWeekMeadowlarkId, documentUuid });
    concurrencyDocumentsAcademicWeek.push({ meadowlarkId: schoolMeadowlarkId, documentUuid: schoolDocument.documentUuid });

    await insertMeadowlarkIdOnConcurrencyCollection(mongoConcurrencyCollection, concurrencyDocumentsAcademicWeek);

    // ----
    // End transaction to insert the AcademicWeek document
    // ----
    await upsertSession.commitTransaction();

    // RND-644
    const concurrencyDocumentsSchool: ConcurrencyDocument[] = [];
    concurrencyDocumentsSchool.push({
      meadowlarkId: schoolMeadowlarkId,
      documentUuid: schoolDocument.documentUuid,
    });

    // Try updating the School document - should fail thanks to the conflict in concurrency collection
    try {
      await insertMeadowlarkIdOnConcurrencyCollection(mongoConcurrencyCollection, concurrencyDocumentsSchool);

      schoolDocument.edfiDoc.nameOfInstitution = 'A School 124';

      await mongoDocumentCollection.replaceOne({ _id: schoolMeadowlarkId }, schoolDocument, asUpsert(updateSession));
      await updateSession.commitTransaction();
    } catch (e) {
      expect(e).toMatchInlineSnapshot(
        `[MongoBulkWriteError: E11000 duplicate key error collection: meadowlark.concurrency index: meadowlarkId_1_documentUuid_1 dup key: { meadowlarkId: "Qw5FvPdKxAXWnGght_4HOBmlPt_xB_pA20fKyQ", documentUuid: "2edb604f-eab0-412c-a242-508d6529214d" }]`,
      );
    } finally {
      // ----
      // End transaction to update the School document
      // ----
      await updateSession.abortTransaction();
    }
  });

  it('should still have the initial nameOfInstitution: A School 123', async () => {
    const collection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
    const result: any = await collection.findOne({ _id: schoolMeadowlarkId });
    expect(result.documentIdentity.schoolId).toBe('123');
    expect(result.edfiDoc.nameOfInstitution).toBe('A School 123');
  });

  afterAll(async () => {
    await getDocumentCollection(client).deleteMany({});
    await getConcurrencyCollection(client).deleteMany({});
    await client.close();
  });
});
