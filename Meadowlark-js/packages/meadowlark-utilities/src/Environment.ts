// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { ConfigKeys } from './Config';
import { ConfigPlugin } from './ConfigPlugin';

// Local cache to be used for storing parsed environment variables.
let cache: { [key: string]: any } = {};

/*
 * Insert or replace a value in the environment cache by key name.
 */
export function updateCache(key: ConfigKeys, value: any): void {
  cache[key] = value;
}

/*
 * Retrieve a value from the environment cache by key name.
 */
export function getFromCache<T>(key: ConfigKeys): T | undefined {
  if (key in cache) {
    return cache[key] as T;
  }

  return undefined;
}

/*
 * Remove a key from the environment cache.
 */
export function removeFromCache(key: ConfigKeys): void {
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
  key: ConfigKeys,
  typeDescription: string,
  parser: (value: string) => T,
  defaultValue: T | undefined = undefined,
): T {
  const cached = getFromCache<T>(key);

  if (cached !== undefined) {
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
export function getStringFromEnvironment(key: ConfigKeys, defaultValue: string | undefined = undefined): string {
  return getValueFromEnvironment<string>(key, 'string', (value: string) => value, defaultValue);
}

/*
 * Gets a boolean value from the environment variables, throwing an error if not found.
 */
export function getBooleanFromEnvironment(key: ConfigKeys, defaultValue: boolean | undefined = undefined): boolean {
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
export function getIntegerFromEnvironment(key: ConfigKeys, defaultValue: number | undefined = undefined): number {
  return getValueFromEnvironment<number>(key, 'integer', (value: string) => Number.parseInt(value, 10), defaultValue);
}

/*
 * Gets an float value from the environment variables, throwing an error if not found.
 */
export function getFloatFromEnvironment(key: ConfigKeys, defaultValue: number | undefined = undefined): number {
  return getValueFromEnvironment<number>(key, 'float', (value: string) => Number.parseFloat(value), defaultValue);
}

export const CachedEnvironmentConfigProvider: ConfigPlugin = {
  async getBool(key: ConfigKeys, defaultValue: boolean | undefined): Promise<boolean> {
    return getValueFromEnvironment<boolean>(
      key,
      'boolean',
      (value: string) => value === 'true' || value === '1',
      defaultValue,
    );
  },
  async getFloat(key: ConfigKeys, defaultValue: number | undefined): Promise<number> {
    return getValueFromEnvironment<number>(key, 'float', (value: string) => Number.parseFloat(value), defaultValue);
  },
  async getInt(key: ConfigKeys, defaultValue: number | undefined): Promise<number> {
    return getValueFromEnvironment<number>(key, 'integer', (value: string) => Number.parseInt(value, 10), defaultValue);
  },
  async getString(key: ConfigKeys, defaultValue: string | undefined): Promise<string> {
    return getValueFromEnvironment<string>(key, 'string', (value: string) => value, defaultValue);
  },
};
