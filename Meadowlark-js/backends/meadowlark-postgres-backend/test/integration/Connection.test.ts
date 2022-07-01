// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Sql, RowList } from 'postgres';
import { resetSharedClient, getSharedClient } from '../../src/repository/Db';

jest.setTimeout(40000);

describe('Test Connection to Postgres Successful', () => {
  let client: Sql<any>;

  beforeAll(async () => {
    client = await getSharedClient();
  });

  it('meadowlark DB and schema should exist', async () => {
    const schemaQueryResult: RowList<any> = await client`
      SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'meadowlark');`;
    expect(schemaQueryResult.count).toEqual(1);
    expect(schemaQueryResult[0].exists);
  });

  it('meadowlark document table should exist', async () => {
    const schemaQueryResult: RowList<any> = await client`SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'meadowlark'
        AND table_name   = 'documents')`;
    expect(schemaQueryResult[0].exists).toBe(true);
  });

  it('meadowlark references table should exist', async () => {
    const schemaQueryResult: RowList<any> = await client`SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'meadowlark'
        AND table_name   = 'references')`;

    expect(schemaQueryResult[0].exists);
  });

  afterAll(async () => {
    resetSharedClient();
  });
});
