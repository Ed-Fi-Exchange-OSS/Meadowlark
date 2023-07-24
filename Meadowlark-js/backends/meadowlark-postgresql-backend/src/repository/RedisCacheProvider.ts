// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// TODO: doesn't belong here in a real ticket, only in POC.

import { RedisClientType, createClient } from 'redis';
import { MeadowlarkId } from '@edfi/meadowlark-core';

let client: RedisClientType;

// TODO: quick-and-dirty shared client. Look into connection pooling and other improvements.
async function getClient(): Promise<RedisClientType> {
  if (client == null) {
    client = createClient();
    // TODO: should use Winston, not console.
    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();

    return client;
  }

  return new Promise((resolve) => {
    resolve(client);
  });
}

// TODO: this is not efficient, because it is performing a single lookup. Should refactor the interface to pass multiple keys
// into the cache provider.
export async function has(ids: MeadowlarkId[]): Promise<MeadowlarkId[]> {
  if (ids.length === 0) {
    return new Promise((resolve) => {
      resolve(ids);
    });
  }

  return (
    getClient()
      .then(async (c) => c.mGet(ids))
      // null values can't be mapped to a MeadowlarkId, but the code below looks like it would do so. Is there a better way of
      // handling this?
      .then(async (values: (string | null)[]) => values.map((x) => x as MeadowlarkId))
  );

  // return (await getClient().then(async (c) => c.exists(id))) === 1;
}

export async function add(id: MeadowlarkId): Promise<void> {
  // Store the ID as the key and value, because the mGet command used by the `has` function above only returns values,
  // without the keys.
  await getClient().then(async (c) => c.set(id, id));

  return new Promise((resolve) => {
    resolve();
  });
}

export async function remove(id: MeadowlarkId): Promise<void> {
  await getClient().then(async (c) => c.del(id));

  return new Promise((resolve) => {
    resolve();
  });
}
