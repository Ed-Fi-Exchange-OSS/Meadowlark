// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as R from 'ramda';
import { MeadowlarkId } from '@edfi/meadowlark-core';
import { PoolClient } from 'pg';
// import * as InMemoryProvider from './InMemoryCacheProvider';
import * as RedisProvider from './RedisCacheProvider';
import { findReferencedMeadowlarkIdsByMeadowlarkId } from './ReferenceValidation';

export async function add(id: MeadowlarkId) {
  // await InMemoryProvider.add(id);
  await RedisProvider.add(id);
}

export async function remove(id: MeadowlarkId) {
  // await InMemoryProvider.remove(id);
  await RedisProvider.remove(id);
}

// TODO: Rethink the name. Add logging. Improve arguments.
export async function validateReferences(
  referenceMeadowlarkIds: MeadowlarkId[],
  traceId: string,
  // TODO: better to pass a closure on the lookup, already containing the client pool,
  // so that this function is not backend provider specific.
  client: PoolClient,
): Promise<MeadowlarkId[]> {
  // TODO: Original approach was to look one-by-one, but more efficient with Redis to search for all at the same time. I did
  // not refactor the in-memory approach to handle that, though it would be simple enough to do so.

  // const notInCache: Set<MeadowlarkId> = new Set();
  // const inCache: Set<MeadowlarkId> = new Set();
  // for (let i = 0; i < referenceMeadowlarkIds.length; i += 1) {
  //   const value = referenceMeadowlarkIds[i];
  //   if (await InMemoryProvider.has(value)) {
  //     inCache.add(value);
  //   } else {
  //     notInCache.add(value);
  //   }
  // }

  const inRedis = await RedisProvider.has(referenceMeadowlarkIds);
  const inCache: Set<MeadowlarkId> = new Set(inRedis);
  const notInCache = R.difference(referenceMeadowlarkIds, inRedis);

  const found = await findReferencedMeadowlarkIdsByMeadowlarkId(Array.from(notInCache), traceId, client);

  for (let j = 0; j < found.length; j += 1) {
    // Add Ids found in the database to the cache
    // await InMemoryProvider.add(found[j]);
    await RedisProvider.add(found[j]);
  }

  return Promise.resolve(Array.from(new Set([...inCache, ...found])));
}
