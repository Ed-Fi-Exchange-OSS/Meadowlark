// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Pool, Client } from 'pg';
import type { PoolClient } from 'pg';
import { Config, Logger } from '@edfi/meadowlark-utilities';
import { createDatabase, checkExistsAndCreateTables } from './SqlHelper';

let singletonDbPool: Pool | null = null;

const getDbConfiguration = () => ({
  host: Config.get<string>('POSTGRES_HOST'),
  port: Config.get<number>('POSTGRES_PORT'),
  user: Config.get<string>('POSTGRES_USER'),
  password: Config.get<string>('POSTGRES_PASSWORD'),
  database: Config.get<string>('MEADOWLARK_DATABASE_NAME'),
});

const moduleName = 'postgresql.repository.Db';

/**
 * Create a connection pool, check that the database and table structure is in place
 * or create it if not and then return the pool
 */
export async function createConnectionPoolAndReturnClient(): Promise<PoolClient> {
  try {
    // Attempt to connect to the meadowlark DB. If the meadowlark database doesn't exist, the connection will fail and throw
    // an error. If this happens, we will create a client connection to the postgres database, create the meadowlark
    // database, and disconnect. From there reconnect the pool to the meadowlark database and continue

    singletonDbPool = new Pool(getDbConfiguration());

    singletonDbPool.on('error', (err, _client) => {
      Logger.error(`${moduleName} a PostgreSQL connection error occurred.`, null, err);
    });

    const poolClient: PoolClient = await singletonDbPool.connect();

    Logger.info(
      `${moduleName}.createConnectionPoolAndReturnClient Connected to ${getDbConfiguration().database} successfully`,
      null,
    );

    return poolClient;
  } catch (e) {
    Logger.error(`${moduleName}.createConnectionPoolAndReturnClient error connecting to PostgreSQL`, null, e);
    // if this anything other than a DB doesn't exist error, there's a bigger problem and we don't want to continue
    if (e.message !== `database "${getDbConfiguration().database}" does not exist`) {
      throw e;
    }
    if (singletonDbPool != null) await singletonDbPool.end();
  }

  // The meadowlark DB doesn't exist, create a separate client that connects to the postgres(default) DB to create
  // meadowlark DB, then reconnect the pool to the meadowlark DB and return
  const meadowlarkDbName = getDbConfiguration().database;
  getDbConfiguration().database = 'postgres';
  const client: Client = new Client(getDbConfiguration());
  try {
    await client.connect();
    await createDatabase(client, meadowlarkDbName);

    Logger.info(`${moduleName}.createConnectionPoolAndReturnClient database ${meadowlarkDbName} created successfully`, null);
  } catch (e) {
    Logger.error(`${moduleName}.createConnectionPoolAndReturnClient Error connecting to PostgreSQL`, null, e);
    throw e;
  } finally {
    if (client != null) await client.end();
  }

  getDbConfiguration().database = 'meadowlark';
  singletonDbPool = new Pool(getDbConfiguration());

  singletonDbPool.on('error', (err, _client) => {
    Logger.error(`${moduleName} a PostgreSQL connection error occurred.`, null, err);
  });

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

/**
 * Nulls out the singleton pool, then closes it
 */
export async function closeSharedConnection() {
  const savedDbPool: Pool | null = singletonDbPool;
  if (singletonDbPool != null) {
    singletonDbPool = null;
    if (savedDbPool != null) {
      await savedDbPool.end();
    }
  }
  Logger.info(`Postgresql connection: closed`, null);
}
