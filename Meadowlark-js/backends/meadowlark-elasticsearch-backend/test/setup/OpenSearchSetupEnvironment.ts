// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi//meadowlark-utilities';
import { Client } from '@opensearch-project/opensearch/.';
import * as OpenSearchContainer from './OpenSearchContainer';
import { getOpenSearchClient } from '../../src/repository/Db';

const moduleName = 'opensearch.repository.Db';

export async function setupOpenSearch() {
  Logger.info('-- Setup OpenSearch environment --', null);
  await OpenSearchContainer.setup();
}

export async function teardownOpenSearch() {
  Logger.info('-- Tearing down OpenSearch environment --', null);
  await OpenSearchContainer.stop();
}

/**
 * Create and return an OpenSearch connection object
 */
export async function getNewTestClient(): Promise<Client> {
  Logger.debug(`${moduleName}.getNewClient creating local client`, null);
  const username = 'admin';
  const password = 'admin';
  const node = process.env.OPENSEARCH_ENDPOINT;
  const auth = { username, password };
  const requestTimeout = 10000;
  return getOpenSearchClient(node, auth, requestTimeout);
}
