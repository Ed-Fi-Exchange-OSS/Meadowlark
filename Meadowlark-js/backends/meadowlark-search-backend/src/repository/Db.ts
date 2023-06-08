// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config, Logger } from '@edfi/meadowlark-utilities';
import { BasicAuth } from '@opensearch-project/opensearch/lib/pool';
import { ClientSearch, newSearchClient } from './ClientSearch';

let singletonClient: ClientSearch | null = null;

const moduleName = 'opensearch.repository.Db';

export async function getSearchClient(node?: string, auth?: BasicAuth, requestTimeout?: number): Promise<ClientSearch> {
  Logger.debug(`${moduleName}.getOpenSearchClient creating local client`, null);
  return newSearchClient(node, auth, requestTimeout);
}

/**
 * Create and return an OpenSearch connection object
 */
export async function getNewClient(): Promise<ClientSearch> {
  Logger.debug(`${moduleName}.getNewClient creating local client`, null);
  let node;
  let auth;
  let requestTimeout = 0;
  const searchApi = Config.get<string>('SEARCH_API');
  switch (searchApi) {
    case 'OpenSearch': {
      node = Config.get<string>('OPENSEARCH_ENDPOINT');
      auth = {
        username: Config.get<string>('OPENSEARCH_USERNAME'),
        password: Config.get<string>('OPENSEARCH_PASSWORD'),
      };
      requestTimeout = Config.get<number>('OPENSEARCH_REQUEST_TIMEOUT');
      return getSearchClient(node, auth, requestTimeout);
    }
    case 'ElasticSearch':
      node = Config.get<string>('ELASTICSEARCH_ENDPOINT');
      auth = {
        username: Config.get<string>('ELASTICSEARCH_USERNAME'),
        password: Config.get<string>('ELASTICSEARCH_PASSWORD'),
      };
      requestTimeout = Config.get<number>('OPENSEARCH_REQUEST_TIMEOUT');
      return getSearchClient(node, auth, requestTimeout);
    default: {
      throw new Error();
    }
  }
}

/**
 * Return the shared client
 */
export async function getSharedClient(): Promise<ClientSearch> {
  if (singletonClient == null) {
    singletonClient = await getNewClient();
  }

  return singletonClient;
}

export async function closeSharedConnection(): Promise<void> {
  if (singletonClient != null) {
    await singletonClient.close();
  }
  singletonClient = null;
  Logger.info(`Opensearch connection: closed`, null);
}
