// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Pool, Client } from 'pg';
import { Logger } from '@edfi//meadowlark-core';
import format from 'pg-format';

let dbPool: Pool | null = null;

const dbConfiguration = {
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5555),
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'abcdefgh1!',
  database: 'meadowlark',
};

export async function checkExistsAndCreateTables(client: Client) {
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS meadowlark`);

    const documentsTableSql =
      'CREATE TABLE IF NOT EXISTS meadowlark.documents(' +
      '_pk bigserial PRIMARY KEY,' +
      'id character varying NOT NULL,' +
      'document_identity JSONB NOT NULL,' +
      'project_name character varying NOT NULL,' +
      'resource_name character varying NOT NULL,' +
      'resource_version character varying NOT NULL,' +
      'is_descriptor boolean NOT NULL,' +
      'validated boolean NOT NULL,' +
      'edfi_doc JSONB NOT NULL);';

    await client.query(documentsTableSql);

    const referencesTableSql =
      'CREATE TABLE IF NOT EXISTS meadowlark.references(' +
      '_pk bigserial PRIMARY KEY,' +
      'references_to character varying NOT NULL,' +
      'references_from character varying NOT NULL);';

    await client.query(referencesTableSql);

    await client.release();
  } catch (e) {
    const message = e.constructor.name.includes('Error') ? e.message : 'unknown';
    Logger.error(`Error connecting Postgres. Error was ${message}`, null);
    throw e;
  }
}

/**
 * Create a connection pool, check that the database and table structure is in place
 * or create it if not and then return the pool
 */
export async function createConnectionPool(): Promise<Pool> {
  try {
    // Attempt to connect to the meadowlark DB, if this is successful, the DB has already been created
    // and we can return
    dbPool = new Pool(dbConfiguration);
    await dbPool.connect();

    Logger.info(`Connected to ${dbConfiguration.database} successfully`, null);

    return dbPool;
  } catch (e) {
    const message = e.constructor.name.includes('Error') ? e.message : 'unknown';
    Logger.error(`Error connecting Postgres. Error was ${message}`, null);

    // if this anything other than a DB doesn't exist error, there's a bigger problem and we don't want to continue
    if (e.message !== `database "${dbConfiguration.database}" does not exist`) {
      throw e;
    }
    dbPool.end();
  }
  // The meadowlark DB doesn't exist, create a separate client that connects to the postgres(default) DB to create
  // meadowlark DB, then reconnect the pool to the meadowlark DB and return
  let client;
  try {
    const meadowlarkDbName = dbConfiguration.database;
    dbConfiguration.database = 'postgres';

    client = new Client(dbConfiguration);
    client.connect();
    await client.query(format('CREATE DATABASE %I', meadowlarkDbName));

    Logger.info(`Database ${meadowlarkDbName} created successfully`, null);
  } catch (e) {
    const message = e.constructor.name.includes('Error') ? e.message : 'unknown';
    Logger.error(`Error connecting Postgres. Error was ${message}`, null);

    throw e;
  } finally {
    await client.end();
  }

  dbConfiguration.database = 'meadowlark';
  dbPool = new Pool(dbConfiguration);

  return dbPool;
}

/**
 * Return the shared client
 */
export async function getSharedClient(): Promise<Client> {
  if (dbPool == null) {
    dbPool = await createConnectionPool();
    checkExistsAndCreateTables(await dbPool.connect());
  }

  // Returns new Postgres Client
  return dbPool.connect();
}
/**
 * Because of the creation/tear down process in integration tests, the pool was still ending when we were
 * trying to start it for the next set of tests, nulling the pool allows to be created in time for tests
 * @param nullPool
 * @returns
 */
export async function closeDB(nullPool: boolean = true) {
  if (dbPool == null) {
    return;
  }

  dbPool.end();
  dbPool = nullPool ? null : dbPool;
}
