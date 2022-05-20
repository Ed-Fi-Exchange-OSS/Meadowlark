// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Pool, Client } from 'pg';
import { Logger } from '@edfi//meadowlark-core';

let dbPool: Pool | null = null;

/**
 * Return a brand new client - which is a connection pool. Only use for testing purposes.
 */
export async function getNewClient(): Promise<Client> {
  const testDbDefinition = {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  };

  try {
    dbPool = new Pool(testDbDefinition);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    Logger.error(`Error connecting Postgres. Error was ${message}`, null);
    throw e;
  }
}

/**
 * Return the shared client
 */
export async function getSharedClient(): Promise<Client> {
  if (dbPool == null) {
    dbPool = await getNewClient();
  }

  // Returns new Postgres Client
  return dbPool.connect();
}
