// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config } from '@edfi/meadowlark-utilities';
import { PoolClient } from 'pg';
import { getSharedClient, resetSharedClient } from './Db';

async function clearTables(client: PoolClient): Promise<void> {
  const dbName = Config.get('MEADOWLARK_DATABASE_NAME');
  await client.query(`TRUNCATE TABLE ${dbName}.documents`);
  await client.query(`TRUNCATE TABLE ${dbName}.references`);
  await client.query(`TRUNCATE TABLE ${dbName}.aliases`);
}

export async function systemTestSetup(): Promise<PoolClient> {
  const client = (await getSharedClient()) as PoolClient;
  await clearTables(client);
  return client;
}

export async function systemTestTeardown(client: PoolClient): Promise<void> {
  await clearTables(client);
  client.release();
  await resetSharedClient();
}
