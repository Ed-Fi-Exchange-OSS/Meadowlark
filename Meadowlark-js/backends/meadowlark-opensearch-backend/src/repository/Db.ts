// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Client, ClientOptions } from '@opensearch-project/opensearch';
import { Logger } from '@edfi//meadowlark-core';

let singletonClient: Client | null = null;

function maskPassword(message: string, password: string): string {
  const re = new RegExp(password, 'g');
  return message.replace(re, '****');
}

/**
 * Create and return an OpenSearch connection object
 */
export async function getNewClient(): Promise<Client> {
  Logger.debug('meadowlark-opensearch: creating local client', null);

  const clientOpts: ClientOptions = {
    node: process.env.OPENSEARCH_ENDPOINT,
    auth: { username: process.env.OPENSEARCH_USERNAME ?? 'x', password: process.env.OPENSEARCH_PASSWORD ?? 'y' },
    /* Might need to setup SSL here in the future */
  };

  try {
    return new Client(clientOpts);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';

    Logger.error(
      maskPassword(
        `meadowlark-opensearch: error connecting with client opts: ${JSON.stringify(clientOpts)}. Error was ${message}`,
        clientOpts.auth?.password ?? '',
      ),
      null,
    );
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
