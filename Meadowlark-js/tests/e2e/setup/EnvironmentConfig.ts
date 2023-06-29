// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Network, StartedNetwork } from 'testcontainers';
import * as ApiContainer from './containers/ApiContainer';
import * as MongoContainer from './containers/MongoContainer';
import * as OpenSearchContainer from './containers/OpenSearchContainer';
import * as ElasticSearchContainer from './containers/ElasticSearchContainer';
import * as PostgreSqlContainer from './containers/PostgresqlContainer';
import { endLog } from './LogConfig';

export async function stop() {
  endLog();
  console.info('-- Tearing down environment --');
  await Promise.all([MongoContainer.stop(), ApiContainer.stop()]);

  if (process.env.DOCUMENT_STORE_PLUGIN === '@edfi/meadowlark-postgresql-backend') {
    console.info('-- Tearing down postgres --');
    await PostgreSqlContainer.stop();
  }

  if (process.env.QUERY_HANDLER_PLUGIN === '@edfi/meadowlark-elasticsearch-backend') {
    console.info('-- Tearing down elasticsearch --');
    await ElasticSearchContainer.stop();
  } else {
    console.info('-- Tearing down opensearch --');
    await OpenSearchContainer.stop();
  }
}

export async function configure(initialize = true) {
  let network: StartedNetwork;
  try {
    network = await new Network().start();
  } catch (error) {
    throw new Error(`\n${error}`);
  }

  if (!initialize) {
    console.warn(
      '⚠️ WARNING: Skipping initialization. Containers should be already be started, if not, setup with `test:e2e:dev:setup`⚠️',
    );
  } else {
    console.info('-- Setting up containers --');
    // Starting Mongo container since it's required for Authentication
    await Promise.all([MongoContainer.setup(network), ApiContainer.setup(network)]);

    if (process.env.DOCUMENT_STORE_PLUGIN === '@edfi/meadowlark-postgresql-backend') {
      console.info('-- Setting up postgres --');
      await PostgreSqlContainer.setup(network);
    }

    if (process.env.QUERY_HANDLER_PLUGIN === '@edfi/meadowlark-elasticsearch-backend') {
      console.info('-- Setting up elasticsearch --');
      await ElasticSearchContainer.setup(network);
    } else {
      console.info('-- Setting up opensearch --');
      await OpenSearchContainer.setup(network);
    }
  }

  console.debug('-- Environment Ready --');
}
