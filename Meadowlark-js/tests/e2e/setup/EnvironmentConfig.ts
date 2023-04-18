// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Network, StartedNetwork } from 'testcontainers';
import * as ApiContainer from './containers/ApiContainer';
import * as MongoContainer from './containers/MongoContainer';
import * as OpenSearchContainer from './containers/OpenSearchContainer';
import * as PostgreSqlContainer from './containers/PostgresqlContainer';
import { endLog } from './LogConfig';

export async function stop() {
  endLog();
  console.info('-- Tearing down environment --');
  await Promise.all([MongoContainer.stop(), ApiContainer.stop(), OpenSearchContainer.stop()]);
  if (process.env.DOCUMENT_STORE_PLUGIN === '@edfi/meadowlark-postgresql-backend') {
    console.info('-- Tearing down postgres --');
    await PostgreSqlContainer.stop();
  }
}

export async function configure() {
  let network: StartedNetwork;
  try {
    network = await new Network().start();
  } catch (error) {
    throw new Error(`\n${error}`);
  }

  if (process.env.DEVELOPER_MODE) {
    console.warn(
      '⚠️ WARNING: Running in DEVELOPER MODE. Containers should be already be started, if not, setup with `test:e2e:dev:setup`⚠️',
    );
  } else {
    console.log(process.env.DOCUMENT_STORE_PLUGIN);
    process.env.ALREADY_SET = 'true';
    console.info('-- Setting up containers --');
    await Promise.all([MongoContainer.setup(network), ApiContainer.setup(network), OpenSearchContainer.setup(network)]);

    if (process.env.DOCUMENT_STORE_PLUGIN === '@edfi/meadowlark-postgresql-backend') {
      console.info('-- Setting up postgres --');
      await PostgreSqlContainer.setup(network);
    }
  }

  console.debug('-- Environment Ready --');
}
