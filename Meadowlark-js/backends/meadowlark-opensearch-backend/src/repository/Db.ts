// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Client, ClientOptions } from '@opensearch-project/opensearch';
import { Config, Logger } from '@edfi/meadowlark-utilities';

let singletonClient: Client | null = null;

const moduleName = 'opensearch.repository.Db';

/**
 * Create and return an OpenSearch connection object
 */
export async function getNewClient(): Promise<Client> {
  Logger.debug(`${moduleName}.getNewClient creating local client`, null);

  const clientOpts: ClientOptions = {
    node: Config.get<string>('OPENSEARCH_ENDPOINT'),
    auth: { username: Config.get<string>('OPENSEARCH_USERNAME'), password: Config.get<string>('OPENSEARCH_PASSWORD') },
    requestTimeout: Config.get<number>('OPENSEARCH_REQUEST_TIMEOUT'),
    /* Might need to setup SSL here in the future */
  };

  try {
    return new Client(clientOpts);
  } catch (e) {
    const masked = { ...clientOpts } as any;
    delete masked.auth?.password;

    Logger.error(`${moduleName}.getNewClient error connecting with options ${JSON.stringify(masked)}`, null, e);
    throw e;
  }
}

/**
 * Return the shared client
 */
export async function getSharedClient(): Promise<Client> {
  if (singletonClient == null) {
    singletonClient = await getNewClient();
  }

  return singletonClient;
}
