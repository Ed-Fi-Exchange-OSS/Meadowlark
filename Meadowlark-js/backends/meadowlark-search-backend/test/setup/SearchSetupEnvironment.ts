// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi//meadowlark-utilities';
import * as searchContainer from './SearchContainer';
import { getSearchClient } from '../../src/repository/Db';
import { ClientSearch } from '../../src/repository/ClientSearch';

const moduleName = 'search.repository.Db';

export async function setupSearch() {
  Logger.info('-- Setup Search environment --', null);
  await searchContainer.setup();
}

export async function teardownSearch() {
  Logger.info('-- Tearing down Search environment --', null);
  await searchContainer.stop();
}

/**
 * Create and return an OpenSearch connection object
 */
export async function getNewTestClient(): Promise<ClientSearch> {
  Logger.debug(`${moduleName}.getNewClient creating local client`, null);
  const username = 'admin';
  const password = 'admin';
  const searchProvider = process.env.SEARCH_PROVIDER;
  const node = searchProvider === 'ElasticSearch' ? 'http://localhost:8201' : 'http://localhost:9200';
  const auth = { username, password };
  const requestTimeout = 10000;
  return getSearchClient(searchProvider, node, auth, requestTimeout);
}
