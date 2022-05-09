// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo, newDocumentInfo, newSecurity, documentIdForDocumentInfo } from '@edfi/meadowlark-core';
import { Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getCollection, getClient } from '../../src/repository/Db';
import { upsertDocument } from '../../src/repository/Upsert';

jest.setTimeout(40000);

const TEST_DB_NAME = 'meadowlark-integration-tests';
process.env.MONGO_DB_NAME = TEST_DB_NAME;

async function resetDb(): Promise<void> {
  const client = new MongoClient('mongodb://mongo1:27017,mongo2:27018,mongo3:27019/?replicaSet=rs0', {
    w: 'majority',
    readConcernLevel: 'majority',
  });
  try {
    await client.connect();
    const db = client.db(TEST_DB_NAME);
    await db.dropDatabase();
  } finally {
    await client.close();
  }
}

describe('given something', () => {
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'key' }],
  };

  const id = documentIdForDocumentInfo(documentInfo);
  beforeAll(async () => {
    await resetDb();
    await upsertDocument(
      id,
      documentInfo,
      { natural: 'key' },
      false,
      { ...newSecurity(), isOwnershipEnabled: false },
      'correlationId',
    );
  });

  afterAll(async () => {
    (await getClient()).close();
  });

  it('exists in db', async () => {
    const mongoCollection: Collection<MeadowlarkDocument> = await getCollection();
    const result: any = await mongoCollection.findOne({ id });
    expect(result).not.toBeNull();
    expect(result.resourceName).toBe('School');
  });
});
