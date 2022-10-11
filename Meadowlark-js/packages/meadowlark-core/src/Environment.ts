// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export type EnvironmentVariable = 'SIGNING_KEY' | 'TOKEN_URL' | 'ALLOWED_SCHOOL_YEARS';

// Local cache to be used for storing parsed environment variables.
const cache: { [key: string]: any } = {};

/*
 * Gets a value from the environment variables, throwing an error if not found.
 */
export function getValueFromEnvironment(key: EnvironmentVariable): string {
  const value = process.env[key];

  if (value != null) {
    return value;
  }

  throw new Error(`Environment variable '${key}' has not been setup properly.`);
}

/*
 * Insert or replace a value in the environment cache by key name.
 */
export function updateCache(key: EnvironmentVariable, value: any): void {
  cache[key] = value;
}

/*
 * Retrieve a value from the environment cache by key name.
 */
export function getFromCache<T>(key: EnvironmentVariable): T | undefined {
  if (key in cache) {
    return cache[key] as T;
  }

  return undefined;
}

/*
 * Remove a key from the environment cache.
 */
export function removeFromCache(key: EnvironmentVariable): void {
  delete cache[key];
}

/*
 * Remove all keys from the environment cache.
 */
export function clearCache(): void {
  cache.clear();
}
