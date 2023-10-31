// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentUuid } from '@edfi/meadowlark-core';
import { MongoClient } from 'mongodb';
import { getConcurrencyCollection, getNewClient, lockDocuments } from '../../src/repository/Db';
import { setupConfigForIntegration } from './Config';
import { ConcurrencyDocument } from '../../src/model/ConcurrencyDocument';

describe('when lockDocuments is called with a given number of documents', () => {
  let client;
  let session;

  beforeAll(async () => {
    await setupConfigForIntegration();
    client = (await getNewClient()) as MongoClient;
    session = client.startSession();

    const concurrencyDocuments: ConcurrencyDocument[] = [
      {
        _id: '123' as DocumentUuid,
      },
      {
        _id: '456' as DocumentUuid,
      },
    ];

    await lockDocuments(getConcurrencyCollection(client), concurrencyDocuments, session);
  });

  it('concurrencyCollection should be empty after the function is called', async () => {
    const documents = await getConcurrencyCollection(client).countDocuments({
      meadowlarkId: {
        $in: ['123', '456'],
      },
    });

    expect(documents).toBe(0);
  });

  afterAll(async () => {
    session.endSession();
    await client.close();
  });
});
