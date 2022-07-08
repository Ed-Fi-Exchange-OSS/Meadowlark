// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Pool, Client } from 'pg';
import type { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-core';
import {
  createDocumentTableSql,
  createDocumentTableUniqueIndexSql,
  createReferencesTableCheckingIndexSql,
  createReferencesTableDeletingIndexSql,
  createReferencesTableSql,
  createSchemaSql,
  createDatabaseSql,
  createExistenceTableSql,
} from './SqlHelper';

let singletonDbPool: Pool | null = null;

const dbConfiguration = {
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.MEADOWLARK_DATABASE_NAME ?? 'meadowlark',
};

/**
 * Checks that the meadowlark schema, document and references tables exist in the database, if not will create them
 * @param client The Postgres client for querying
 */
export async function checkExistsAndCreateTables(client: PoolClient) {
  try {
    await client.query(createSchemaSql);
    await client.query(createDocumentTableSql);
    await client.query(createDocumentTableUniqueIndexSql);
    await client.query(createReferencesTableSql);
    await client.query(createReferencesTableCheckingIndexSql);
    await client.query(createReferencesTableDeletingIndexSql);
    await client.query(createExistenceTableSql);
  } catch (e) {
    const message = e.constructor.name.includes('Error') ? e.message : 'unknown';
    Logger.error(`Error connecting to PostgreSQL. Error was ${message}`, null);
    throw e;
  }
}

/**
 * Create a connection pool, check that the database and table structure is in place
 * or create it if not and then return the pool
 */
export async function createConnectionPoolAndReturnClient(): Promise<PoolClient> {
  try {
    // Attempt to connect to the meadowlark DB. If the meadowlark database doesn't exist, the connection will fail and throw
    // an error. If this happens, we will create a client connection to the postgres database, create the meadowlark
    // database, and disconnect. From there reconnect the pool to the meadowlark database and continue

    singletonDbPool = new Pool(dbConfiguration);
    const poolClient: PoolClient = await singletonDbPool.connect();

    Logger.info(`Connected to ${dbConfiguration.database} successfully`, null);

    return poolClient;
  } catch (e) {
    const message = e.constructor.name.includes('Error') ? e.message : 'unknown';
    Logger.error(`Error connecting to PostgreSQL. Error was ${message}`, null);
    // if this anything other than a DB doesn't exist error, there's a bigger problem and we don't want to continue
    if (e.message !== `database "${dbConfiguration.database}" does not exist`) {
      throw e;
    }
    if (singletonDbPool != null) singletonDbPool.end();
  }

  // The meadowlark DB doesn't exist, create a separate client that connects to the postgres(default) DB to create
  // meadowlark DB, then reconnect the pool to the meadowlark DB and return
  const meadowlarkDbName = dbConfiguration.database;
  dbConfiguration.database = 'postgres';
  const client: Client = new Client(dbConfiguration);
  try {
    client.connect();
    await client.query(createDatabaseSql(meadowlarkDbName));

    Logger.info(`Database ${meadowlarkDbName} created successfully`, null);
  } catch (e) {
    const message = e.constructor.name.includes('Error') ? e.message : 'unknown';
    Logger.error(`Error connecting to PostgreSQL. Error was ${message}`, null);
    throw e;
  } finally {
    if (client != null) await client.end();
  }

  dbConfiguration.database = 'meadowlark';
  singletonDbPool = new Pool(dbConfiguration);

  return singletonDbPool.connect();
}

/**
 * Return the shared client
 */
export async function getSharedClient(): Promise<PoolClient> {
  if (singletonDbPool == null) {
    const client: PoolClient = await createConnectionPoolAndReturnClient();
    await checkExistsAndCreateTables(client);
    return client;
  }

  // Returns new Postgres Client
  return singletonDbPool.connect();
}

/**
 * Nulls out the singleton pool, then closes it
 */
export async function resetSharedClient() {
  const savedDbPool: Pool | null = singletonDbPool;
  if (singletonDbPool != null) {
    singletonDbPool = null;
    if (savedDbPool != null) {
      await savedDbPool.end();
    }
  }
}
