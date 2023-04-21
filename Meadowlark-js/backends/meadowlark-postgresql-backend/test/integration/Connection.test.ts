// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient, QueryResult } from 'pg';
import { resetSharedClient, getSharedClient } from '../../src/repository/Db';

describe('Test Connection to Postgres Successful', () => {
  let client: PoolClient;

  beforeAll(async () => {
    client = await getSharedClient();
  });

  it('meadowlark DB and schema should exist', async () => {
    const schemaQueryResult: QueryResult = await client.query(
      "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'meadowlark');",
    );
    expect(schemaQueryResult.rows[0].exists);
  });

  it('meadowlark document table should exist', async () => {
    const schemaQueryResult: QueryResult = await client.query(
      'SELECT EXISTS (' +
        ' SELECT FROM information_schema.tables' +
        " WHERE table_schema = 'meadowlark'" +
        " AND table_name   = 'documents')",
    );
    expect(schemaQueryResult.rows[0].exists);
  });

  it('meadowlark references table should exist', async () => {
    const schemaQueryResult: QueryResult = await client.query(
      'SELECT EXISTS (' +
        ' SELECT FROM information_schema.tables' +
        " WHERE table_schema = 'meadowlark'" +
        " AND table_name   = 'references')",
    );
    expect(schemaQueryResult.rows[0].exists);
  });

  afterAll(async () => {
    client.release();
    await resetSharedClient();
  });
});
