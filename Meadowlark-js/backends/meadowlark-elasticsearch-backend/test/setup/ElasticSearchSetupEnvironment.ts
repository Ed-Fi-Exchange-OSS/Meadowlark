// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi//meadowlark-utilities';
import { Client } from '@elastic/elasticsearch';
import * as ElasticSearchContainer from './ElasticSearchContainer';
import { getElasticSearchClient } from '../../src/repository/Db';

const moduleName = 'elasticsearch.repository.Db';

export async function setupElasticSearch() {
  Logger.info('-- Setup ElasticSearch environment --', null);
  await ElasticSearchContainer.setup();
}

export async function teardownElasticSearch() {
  Logger.info('-- Tearing down ElasticSearch environment --', null);
  await ElasticSearchContainer.stop();
}

/**
 * Create and return an ElasticSearch connection object
 */
export async function getNewTestClient(): Promise<Client> {
  Logger.debug(`${moduleName}.getNewClient creating local client`, null);
  const node = process.env.ELASTICSEARCH_ENDPOINT;
  const auth = { username: '', password: '' };
  const requestTimeout = 10000;
  return getElasticSearchClient(node, auth, requestTimeout);
}
