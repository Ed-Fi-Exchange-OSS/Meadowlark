// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Pool, Client } from 'pg';
import type { PoolClient } from 'pg';
import { Logger } from '@edfi//meadowlark-core';
import { createDocumentTableSql, createReferencesTableSql, createSchemaSql, GetCreateDatabaseSql } from './QueryHelper';

let dbPool: Pool | null = null;

const dbConfiguration = {
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: 'meadowlark',
};

/**
 * Checks that the meadowlark schema, document and references tables exist in the database, if not will create them
 * @param client The Postgres client for querying
 */
export async function checkExistsAndCreateTables(client: PoolClient) {
  try {
    await client.query(createSchemaSql);
    await client.query(createDocumentTableSql);
    await client.query(createReferencesTableSql);
  } catch (e) {
    const message = e.constructor.name.includes('Error') ? e.message : 'unknown';
    Logger.error(`Error connecting PostgreSql. Error was ${message}`, null);
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

    dbPool = new Pool(dbConfiguration);
    const poolClient: PoolClient = await dbPool.connect();

    Logger.info(`Connected to ${dbConfiguration.database} successfully`, null);

    return poolClient;
  } catch (e) {
    const message = e.constructor.name.includes('Error') ? e.message : 'unknown';

    // if this anything other than a DB doesn't exist error, there's a bigger problem and we don't want to continue
    if (e.message !== `database "${dbConfiguration.database}" does not exist`) {
      Logger.error(`Error connecting Postgres. Error was ${message}`, null);
      throw e;
    }
    if (dbPool != null) dbPool.end();
  }

  // The meadowlark DB doesn't exist, create a separate client that connects to the postgres(default) DB to create
  // meadowlark DB, then reconnect the pool to the meadowlark DB and return
  const client: Client = new Client(dbConfiguration);
  try {
    const meadowlarkDbName = dbConfiguration.database;
    dbConfiguration.database = 'postgres';

    client.connect();
    await client.query(await GetCreateDatabaseSql(meadowlarkDbName));

    Logger.info(`Database ${meadowlarkDbName} created successfully`, null);
  } catch (e) {
    const message = e.constructor.name.includes('Error') ? e.message : 'unknown';
    Logger.error(`Error connecting Postgres. Error was ${message}`, null);
    throw e;
  } finally {
    if (client != null) await client.end();
  }

  dbConfiguration.database = 'meadowlark';
  dbPool = new Pool(dbConfiguration);

  return dbPool.connect();
}

/**
 * Return the shared client
 */
export async function getSharedClient(): Promise<PoolClient> {
  if (dbPool == null) {
    const client: PoolClient = await createConnectionPoolAndReturnClient();
    await checkExistsAndCreateTables(client);
    return client;
  }

  // Returns new Postgres Client
  return dbPool.connect();
}
/**
 * Due to the creation/tear down process in integration tests, the pool was still ending when we were
 * trying to start it for the next set of tests, nulling the pool allows to be created in time for tests
 */
export async function resetSharedClient() {
  if (dbPool != null) {
    await dbPool.end();
  }
  dbPool = null;
}
