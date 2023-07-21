// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MeadowlarkId } from '@edfi/meadowlark-core';

// Implementation notes: if we choose to use a time-to-live strategy then consider
// https://www.npmjs.com/package/@isaacs/ttlcache, which is already used in
// AuthorizationMiddleware. But don't use it without a TTL - dangerous.

const cache: Set<MeadowlarkId> = new Set();

export async function has(id: MeadowlarkId): Promise<boolean> {
  return new Promise((resolve) => {
    resolve(cache.has(id));
  });
}

export async function add(id: MeadowlarkId): Promise<void> {
  cache.add(id);

  return new Promise((resolve) => {
    resolve();
  });
}

export async function remove(id: MeadowlarkId): Promise<void> {
  cache.delete(id);

  return new Promise((resolve) => {
    resolve();
  });
}
