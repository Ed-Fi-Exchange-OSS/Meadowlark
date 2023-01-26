// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import os from 'os';
import { ConfigPlugin } from './ConfigPlugin';

export type ConfigKeys =
  | 'OAUTH_SIGNING_KEY'
  | 'BEGIN_ALLOWED_SCHOOL_YEAR'
  | 'END_ALLOWED_SCHOOL_YEAR'
  | 'AUTHORIZATION_STORE_PLUGIN'
  | 'OAUTH_EXPIRATION_MINUTES'
  | 'OAUTH_TOKEN_ISSUER'
  | 'OAUTH_TOKEN_AUDIENCE'
  | 'OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST'
  | 'OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION'
  | 'OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH'
  | 'OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH'
  | 'OAUTH_HARD_CODED_CREDENTIALS_ENABLED'
  | 'ALLOW_TYPE_COERCION'
  | 'ALLOW__EXT_PROPERTY'
  | 'FASTIFY_NUM_THREADS'
  | 'MEADOWLARK_DATABASE_NAME'
  | 'MONGO_URL'
  | 'MONGO_LOG_LEVEL'
  | 'MONGO_WRITE_CONCERN'
  | 'MONGO_READ_CONCERN'
  | 'OPENSEARCH_ENDPOINT'
  | 'OPENSEARCH_USERNAME'
  | 'OPENSEARCH_PASSWORD'
  | 'LISTENER1_PLUGIN'
  | 'LISTENER2_PLUGIN'
  | 'QUERY_HANDLER_PLUGIN'
  | 'DOCUMENT_STORE_PLUGIN'
  | 'POSTGRES_HOST'
  | 'POSTGRES_PORT'
  | 'POSTGRES_USER'
  | 'POSTGRES_PASSWORD'
  | 'OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_TTL'
  | 'OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_MAX_ENTRIES';

const ThrowIfNotFound = undefined;
const CpuCount = os.cpus().length;
const DEFAULT_TOKEN_ISSUER = 'edfi-meadowlark-issuer';
const DEFAULT_TOKEN_AUDIENCE = 'edfi-meadowlark-audience';

type ConfigValueType = string | number | boolean | Buffer | undefined;

const configCollection: { [key: string]: ConfigValueType } = {};

/*
 * Set a config setting. Generally only used within the Config module or by unit tests.
 */
export const set = (key: ConfigKeys, value: ConfigValueType): void => {
  configCollection[key] = value;
};

/*
 * Retrieve a config setting
 */
export function get<T extends ConfigValueType>(key: ConfigKeys): T {
  if (key in configCollection) {
    return configCollection[key] as T;
  }

  throw Error(`Config key '${key}' is not available.`);
}

/*
 * Pre-load all configuration from the injected provider.
 */
export async function initializeConfig(provider: ConfigPlugin) {
  try {
    const signingKeyEncoded = await provider.getString('OAUTH_SIGNING_KEY', ThrowIfNotFound);
    set('OAUTH_SIGNING_KEY', Buffer.from(signingKeyEncoded, 'base64'));
  } catch {
    throw new Error('Must have a base-64 encoded signing key. Try creating a new one with `npm run createKey`');
  }

  set('OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_TTL', await provider.getInt('OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_TTL', 300000));
  set(
    'OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_MAX_ENTRIES',
    await provider.getInt('OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_MAX_ENTRIES', 1000),
  );
  set('AUTHORIZATION_STORE_PLUGIN', await provider.getString('AUTHORIZATION_STORE_PLUGIN', ThrowIfNotFound));
  set('DOCUMENT_STORE_PLUGIN', await provider.getString('DOCUMENT_STORE_PLUGIN', ThrowIfNotFound));
  set('MONGO_LOG_LEVEL', await provider.getString('MONGO_LOG_LEVEL', 'error'));
  set(
    'MONGO_URL',
    await provider.getString('MONGO_URL', 'mongodb://mongo1:27017,mongo2:27018,mongo3:27019/?replicaSet=rs0'),
  );
  set('MONGO_WRITE_CONCERN', await provider.getString('MONGO_WRITE_CONCERN', 'majority'));
  set('MONGO_READ_CONCERN', await provider.getString('MONGO_READ_CONCERN', 'majority'));

  set('POSTGRES_HOST', await provider.getString('POSTGRES_HOST', 'localhost'));
  set('POSTGRES_PORT', await provider.getInt('POSTGRES_PORT', 5432));
  set('POSTGRES_USER', await provider.getString('POSTGRES_USER', ''));
  set('POSTGRES_PASSWORD', await provider.getString('POSTGRES_PASSWORD', ''));
  set('MEADOWLARK_DATABASE_NAME', await provider.getString('MEADOWLARK_DATABASE_NAME', 'meadowlark'));

  set('LISTENER1_PLUGIN', await provider.getString('LISTENER1_PLUGIN', ''));
  set('LISTENER2_PLUGIN', await provider.getString('LISTENER2_PLUGIN', ''));
  set('QUERY_HANDLER_PLUGIN', await provider.getString('QUERY_HANDLER_PLUGIN', ''));

  // should only be required if enabled...
  if (
    get<string>('LISTENER1_PLUGIN') === '@edfi/meadowlark-opensearch-backend' ||
    get<string>('LISTENER2_PLUGIN') === '@edfi/meadowlark-opensearch-backend' ||
    get<string>('QUERY_HANDLER_PLUGIN') === '@edfi/meadowlark-opensearch-backend'
  ) {
    set('OPENSEARCH_ENDPOINT', await provider.getString('OPENSEARCH_ENDPOINT', ThrowIfNotFound));
    set('OPENSEARCH_USERNAME', await provider.getString('OPENSEARCH_USERNAME', 'x'));
    set('OPENSEARCH_PASSWORD', await provider.getString('OPENSEARCH_PASSWORD', 'y'));
  }

  set('ALLOW_TYPE_COERCION', await provider.getBool('ALLOW_TYPE_COERCION', false));
  set('ALLOW__EXT_PROPERTY', await provider.getBool('ALLOW__EXT_PROPERTY', false));
  set('FASTIFY_NUM_THREADS', await provider.getInt('FASTIFY_NUM_THREADS', CpuCount));

  set('OAUTH_EXPIRATION_MINUTES', await provider.getInt('OAUTH_EXPIRATION_MINUTES', 60));
  set('OAUTH_TOKEN_ISSUER', await provider.getString('OAUTH_TOKEN_ISSUER', DEFAULT_TOKEN_ISSUER));
  set('OAUTH_TOKEN_AUDIENCE', await provider.getString('OAUTH_TOKEN_AUDIENCE', DEFAULT_TOKEN_AUDIENCE));
  set(
    'OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST',
    await provider.getString('OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST', ThrowIfNotFound),
  );
  set(
    'OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION',
    await provider.getString('OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION', ThrowIfNotFound),
  );
  set(
    'OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH',
    await provider.getString('OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH', ThrowIfNotFound),
  );
  set(
    'OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH',
    await provider.getString('OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH', ThrowIfNotFound),
  );
  set('OAUTH_HARD_CODED_CREDENTIALS_ENABLED', await provider.getBool('OAUTH_HARD_CODED_CREDENTIALS_ENABLED', false));

  set('BEGIN_ALLOWED_SCHOOL_YEAR', await provider.getInt('BEGIN_ALLOWED_SCHOOL_YEAR', 1900));
  set('END_ALLOWED_SCHOOL_YEAR', await provider.getInt('END_ALLOWED_SCHOOL_YEAR', 2100));
}
