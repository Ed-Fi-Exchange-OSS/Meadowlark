/* eslint-disable no-unused-expressions */
// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-core';
import postgres from 'postgres';
import {
  createDatabaseSql,
  createDocumentTableSql,
  createDocumentTableUniqueIndexSql,
  createReferencesTableCheckingIndexSql,
  createReferencesTableDeletingIndexSql,
  createReferencesTableSql,
  createSchemaSql,
} from './SqlHelper';

let dbPool: any | null = null;

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
export async function checkExistsAndCreateTables(client: postgres.Sql<any>) {
  try {
    await client`${createSchemaSql(client)}`;
    await client`${createDocumentTableSql(client)}`;
    await client`${createReferencesTableSql(client)}`;
    await client`${createDocumentTableUniqueIndexSql(client)}`;
    await client`${createReferencesTableCheckingIndexSql(client)}`;
    await client`${createReferencesTableDeletingIndexSql(client)}`;
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
export async function createConnectionPoolAndReturnClient(): Promise<postgres.Sql<any>> {
  try {
    // Attempt to connect to the meadowlark DB. If the meadowlark database doesn't exist, the connection will fail and throw
    // an error. If this happens, we will create a client connection to the postgres database, create the meadowlark
    // database, and disconnect. From there reconnect the pool to the meadowlark database and continue

    dbPool = postgres(dbConfiguration);
    // Testing that the connection exists
    await dbPool`SELECT NOW();`;

    Logger.info(`Connected to ${dbConfiguration.database} successfully`, null);
    return dbPool;
  } catch (e) {
    const message = e.constructor.name.includes('Error') ? e.message : 'unknown';
    Logger.error(`Error connecting to PostgreSQL. Error was ${message}`, null);
    // if this anything other than a DB doesn't exist error, there's a bigger problem and we don't want to continue
    if (e.message !== `database "${dbConfiguration.database}" does not exist`) {
      throw e;
    }
    if (dbPool != null) dbPool.end();
  }
  const chosenDbName = dbConfiguration.database;
  dbConfiguration.database = 'postgres';
  try {
    dbPool = postgres(dbConfiguration);
    await createDatabaseSql(dbPool);
  } catch (e) {
    const message = e.constructor.name.includes('Error') ? e.message : 'unknown';
    Logger.error(`Error connecting to PostgreSQL. Error was ${message}`, null);
    throw e;
  } finally {
    if (dbPool != null) await dbPool.end();
  }
  dbConfiguration.database = chosenDbName;
  dbPool = postgres(dbConfiguration);
  return dbPool;
}

/**
 * Return the shared client
 */
export async function getSharedClient(): Promise<postgres.Sql<any>> {
  if (dbPool == null) {
    dbPool = await createConnectionPoolAndReturnClient();
    await checkExistsAndCreateTables(dbPool);
  }

  return dbPool;
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
