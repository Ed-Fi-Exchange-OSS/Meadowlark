// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo, newDocumentInfo, newSecurity, documentIdForDocumentInfo } from '@edfi/meadowlark-core';
import { Collection, MongoClient } from 'mongodb';
import { MeadowlarkDocument } from '../../src/model/MeadowlarkDocument';
import { getCollection, getNewClient } from '../../src/repository/Db';
import { upsertDocument } from '../../src/repository/Upsert';

jest.setTimeout(400000);

describe('given something', () => {
  let client;

  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    resourceName: 'School',
    documentIdentity: [{ name: 'natural', value: 'key' }],
  };
  const id = documentIdForDocumentInfo(documentInfo);

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;

    await upsertDocument(
      id,
      documentInfo,
      { natural: 'key' },
      false,
      { ...newSecurity(), isOwnershipEnabled: false },
      'correlationId',
      client,
    );
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
  });

  it('exists in db', async () => {
    const collection: Collection<MeadowlarkDocument> = getCollection(client);
    const result: any = await collection.findOne({ id });
    expect(result).not.toBeNull();
    expect(result.resourceName).toBe('School');
  });
});
