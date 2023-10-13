// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { StartedTestContainer } from 'testcontainers';

let startedContainer: StartedTestContainer;

export async function setup() {
  Logger.info('-- Setup PostgresqlContainer environment --', null);

  process.env.POSTGRES_USER = process.env.POSTGRES_USER ?? 'postgres';
  process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'abcdefgh1!';
  process.env.MEADOWLARK_DATABASE_NAME = process.env.MEADOWLARK_DATABASE_NAME ?? 'meadowlark-test';
  const image = 'postgres:14.3-alpine@sha256:84c6ea4333ae18f25ea0fb18bb142156f2a2e545e0a779d93bbf08079e56bdaf';

  try {
    const container = new PostgreSqlContainer(image)
      .withName('postgres-test')
      .withDatabase(process.env.MEADOWLARK_DATABASE_NAME)
      .withUsername(process.env.POSTGRES_USER)
      .withPassword(process.env.POSTGRES_PASSWORD);

    startedContainer = await container.start();

    process.env.POSTGRES_HOST = startedContainer.getHost();
    process.env.POSTGRES_PORT = `${startedContainer.getFirstMappedPort()}`;
  } catch (error) {
    throw new Error(`\nUnexpected error setting up postgres container:\n${error}`);
  }
}

export async function stop(): Promise<void> {
  Logger.info('-- Tearing down PostgresqlContainer environment --', null);
  await startedContainer.stop();
}
