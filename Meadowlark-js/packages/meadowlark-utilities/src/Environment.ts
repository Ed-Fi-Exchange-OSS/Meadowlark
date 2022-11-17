// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export type EnvironmentVariable =
  | 'OAUTH_SIGNING_KEY'
  | 'BEGIN_ALLOWED_SCHOOL_YEAR'
  | 'END_ALLOWED_SCHOOL_YEAR'
  | 'OAUTH_EXPIRATION_MINUTES'
  | 'OAUTH_TOKEN_ISSUER'
  | 'OAUTH_TOKEN_AUDIENCE'
  | 'OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST'
  | 'OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION'
  | 'OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH'
  | 'OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH';

// Local cache to be used for storing parsed environment variables.
let cache: { [key: string]: any } = {};

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
  cache = {};
}

/*
 * Gets a value from the environment variables, throwing an error if not found.
 */
export function getValueFromEnvironment<T>(
  key: EnvironmentVariable,
  typeDescription: string,
  parser: (value: string) => T,
  defaultValue: T | undefined = undefined,
): T {
  const cached = getFromCache<T>(key);

  if (cached) {
    return cached;
  }

  const value = process.env[key];

  if (value == null) {
    if (defaultValue !== undefined) {
      updateCache(key, defaultValue);
      return defaultValue;
    }
    throw new Error(`Environment variable '${key}' has not been setup properly.`);
  }

  try {
    const parsed = parser(value);

    updateCache(key, parsed);
    return parsed;
  } catch {
    throw new Error(`Could not parse '${value}' as ${typeDescription}`);
  }
}

/*
 * Gets a string value from the environment variables, throwing an error if not found.
 */
export function getStringFromEnvironment(key: EnvironmentVariable, defaultValue: string | undefined = undefined): string {
  return getValueFromEnvironment<string>(key, 'string', (value: string) => value, defaultValue);
}

/*
 * Gets a boolean value from the environment variables, throwing an error if not found.
 */
export function getBooleanFromEnvironment(key: EnvironmentVariable, defaultValue: boolean | undefined = undefined): boolean {
  return getValueFromEnvironment<boolean>(
    key,
    'boolean',
    (value: string) => value === 'true' || value === '1',
    defaultValue,
  );
}

/*
 * Gets an integer value from the environment variables, throwing an error if not found.
 */
export function getIntegerFromEnvironment(key: EnvironmentVariable, defaultValue: number | undefined = undefined): number {
  return getValueFromEnvironment<number>(key, 'integer', (value: string) => Number.parseInt(value, 10), defaultValue);
}

/*
 * Gets an float value from the environment variables, throwing an error if not found.
 */
export function getFloatFromEnvironment(key: EnvironmentVariable, defaultValue: number | undefined = undefined): number {
  return getValueFromEnvironment<number>(key, 'float', (value: string) => Number.parseFloat(value), defaultValue);
}
