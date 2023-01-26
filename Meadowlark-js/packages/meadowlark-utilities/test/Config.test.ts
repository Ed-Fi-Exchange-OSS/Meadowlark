// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import os from 'os';
import { ConfigKeys } from '../src/Config';

describe('when getting and setting a config value', () => {
  // Not very practical or useful to try to test the set/get methods in isolation
  describe('getting a key that has not been set', () => {
    it('throws an error', async () => {
      const Config = await import('../src/Config');

      expect(() => Config.get('BEGIN_ALLOWED_SCHOOL_YEAR')).toThrowErrorMatchingInlineSnapshot(
        `"Config key 'BEGIN_ALLOWED_SCHOOL_YEAR' is not available."`,
      );
    });
  });

  describe('setting and getting a key', () => {
    it('successfully sets and retrieves the same value', async () => {
      const value = 2039;
      const Config = await import('../src/Config');
      Config.set('BEGIN_ALLOWED_SCHOOL_YEAR', value);

      expect(Config.get('BEGIN_ALLOWED_SCHOOL_YEAR')).toBe(value);
    });
  });
});

describe('when initializing configuration', () => {
  // Testing this in isolation is possible but painful without a ton of value. Go ahead and test in integration with
  // Environment.

  const CpuCount = os.cpus().length;
  const OAUTH_SIGNING_KEY = 'aGVsbG8gd29yZAo=';
  const DOCUMENT_STORE_PLUGIN = 'a1';
  const MONGO_LOG_LEVEL = 'a2';
  const MONGO_URL = 'a3';
  const MONGO_WRITE_CONCERN = 'a4';
  const MONGO_READ_CONCERN = 'a5';
  const POSTGRES_HOST = 'a6';
  const POSTGRES_PORT = 3433;
  const POSTGRES_USER = 'a7';
  const POSTGRES_PASSWORD = 'a8';
  const MEADOWLARK_DATABASE_NAME = 'a9';
  const LISTENER1_PLUGIN = 'b1';
  const LISTENER2_PLUGIN = 'b2';
  const QUERY_HANDLER_PLUGIN = '@edfi/meadowlark-opensearch-backend';
  const OPENSEARCH_ENDPOINT = 'b4';
  const OPENSEARCH_USERNAME = 'b5';
  const OPENSEARCH_PASSWORD = 'b6';
  const ALLOW_TYPE_COERCION = true;
  const ALLOW__EXT_PROPERTY = true;
  const FASTIFY_NUM_THREADS = 99;
  const OAUTH_EXPIRATION_MINUTES = -10;
  const OAUTH_TOKEN_ISSUER = 'b7';
  const OAUTH_TOKEN_AUDIENCE = 'b8';
  const OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST = 'b9';
  const OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION = 'b10';
  const OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH = 'c1';
  const OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH = 'c2';
  const OAUTH_HARD_CODED_CREDENTIALS_ENABLED = true;
  const BEGIN_ALLOWED_SCHOOL_YEAR = 1999;
  const END_ALLOWED_SCHOOL_YEAR = 3992;
  const AUTHORIZATION_STORE_PLUGIN = 'c3';

  // eslint-disable-next-line prefer-destructuring
  const env = process.env;

  const setAllValues = () => {
    process.env = {};
    process.env.END_ALLOWED_SCHOOL_YEAR = END_ALLOWED_SCHOOL_YEAR.toString();
    process.env.BEGIN_ALLOWED_SCHOOL_YEAR = BEGIN_ALLOWED_SCHOOL_YEAR.toString();
    process.env.OAUTH_HARD_CODED_CREDENTIALS_ENABLED = OAUTH_HARD_CODED_CREDENTIALS_ENABLED.toString();
    process.env.OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH = OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH;
    process.env.OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH = OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH;
    process.env.OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION = OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION;
    process.env.OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST = OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST;
    process.env.OAUTH_TOKEN_AUDIENCE = OAUTH_TOKEN_AUDIENCE;
    process.env.OAUTH_TOKEN_ISSUER = OAUTH_TOKEN_ISSUER;
    process.env.OAUTH_EXPIRATION_MINUTES = OAUTH_EXPIRATION_MINUTES.toString();
    process.env.FASTIFY_NUM_THREADS = FASTIFY_NUM_THREADS.toString();
    process.env.ALLOW__EXT_PROPERTY = ALLOW__EXT_PROPERTY.toString();
    process.env.ALLOW_TYPE_COERCION = ALLOW_TYPE_COERCION.toString();
    process.env.OPENSEARCH_PASSWORD = OPENSEARCH_PASSWORD;
    process.env.OPENSEARCH_USERNAME = OPENSEARCH_USERNAME;
    process.env.OPENSEARCH_ENDPOINT = OPENSEARCH_ENDPOINT;
    process.env.QUERY_HANDLER_PLUGIN = QUERY_HANDLER_PLUGIN;
    process.env.LISTENER2_PLUGIN = LISTENER2_PLUGIN;
    process.env.LISTENER1_PLUGIN = LISTENER1_PLUGIN;
    process.env.MEADOWLARK_DATABASE_NAME = MEADOWLARK_DATABASE_NAME;
    process.env.POSTGRES_PASSWORD = POSTGRES_PASSWORD;
    process.env.POSTGRES_USER = POSTGRES_USER;
    process.env.POSTGRES_PORT = POSTGRES_PORT.toString();
    process.env.POSTGRES_HOST = POSTGRES_HOST;
    process.env.MONGO_READ_CONCERN = MONGO_READ_CONCERN;
    process.env.MONGO_WRITE_CONCERN = MONGO_WRITE_CONCERN;
    process.env.MONGO_URL = MONGO_URL;
    process.env.MONGO_LOG_LEVEL = MONGO_LOG_LEVEL;
    process.env.DOCUMENT_STORE_PLUGIN = DOCUMENT_STORE_PLUGIN;
    process.env.OAUTH_SIGNING_KEY = OAUTH_SIGNING_KEY;
    process.env.AUTHORIZATION_STORE_PLUGIN = AUTHORIZATION_STORE_PLUGIN;
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = {};
  });

  afterAll(() => {
    process.env = env;
  });

  describe('given there is no oauth key', () => {
    beforeAll(() => {
      setAllValues();
      delete process.env.OAUTH_SIGNING_KEY;
    });

    afterAll(() => {
      process.env.OAUTH_SIGNING_KEY = OAUTH_SIGNING_KEY;
    });

    it('throws an error with message about the signing key', async () => {
      const Config = await import('../src/Config');
      const Environment = await import('../src/Environment');

      await Config.initializeConfig(Environment.CachedEnvironmentConfigProvider).catch((e) =>
        expect(e).toMatchInlineSnapshot(
          '[Error: Must have a base-64 encoded signing key. Try creating a new one with `npm run createKey`]',
        ),
      );
    });
  });

  describe('given all required elements are set', () => {
    let Config: any;

    beforeAll(async () => {
      setAllValues();
      Config = await import('../src/Config');
      const Environment = await import('../src/Environment');
      await Config.initializeConfig(Environment.CachedEnvironmentConfigProvider);
    });

    it('has stored the signing key', () => {
      expect(Config.get('OAUTH_SIGNING_KEY')).toStrictEqual(Buffer.from(OAUTH_SIGNING_KEY, 'base64'));
    });

    it.each([
      ['DOCUMENT_STORE_PLUGIN', DOCUMENT_STORE_PLUGIN],
      ['MONGO_LOG_LEVEL', MONGO_LOG_LEVEL],
      ['MONGO_URL', MONGO_URL],
      ['MONGO_WRITE_CONCERN', MONGO_WRITE_CONCERN],
      ['MONGO_READ_CONCERN', MONGO_READ_CONCERN],
      ['POSTGRES_HOST', POSTGRES_HOST],
      ['POSTGRES_PORT', POSTGRES_PORT],
      ['POSTGRES_USER', POSTGRES_USER],
      ['POSTGRES_PASSWORD', POSTGRES_PASSWORD],
      ['MEADOWLARK_DATABASE_NAME', MEADOWLARK_DATABASE_NAME],
      ['LISTENER1_PLUGIN', LISTENER1_PLUGIN],
      ['LISTENER2_PLUGIN', LISTENER2_PLUGIN],
      ['QUERY_HANDLER_PLUGIN', QUERY_HANDLER_PLUGIN],
      ['OPENSEARCH_ENDPOINT', OPENSEARCH_ENDPOINT],
      ['OPENSEARCH_USERNAME', OPENSEARCH_USERNAME],
      ['OPENSEARCH_PASSWORD', OPENSEARCH_PASSWORD],
      ['ALLOW_TYPE_COERCION', ALLOW_TYPE_COERCION],
      ['ALLOW__EXT_PROPERTY', ALLOW__EXT_PROPERTY],
      ['FASTIFY_NUM_THREADS', FASTIFY_NUM_THREADS],
      ['OAUTH_EXPIRATION_MINUTES', OAUTH_EXPIRATION_MINUTES],
      ['OAUTH_TOKEN_ISSUER', OAUTH_TOKEN_ISSUER],
      ['OAUTH_TOKEN_AUDIENCE', OAUTH_TOKEN_AUDIENCE],
      ['OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST', OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST],
      ['OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION', OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION],
      ['OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH', OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH],
      ['OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH', OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH],
      ['OAUTH_HARD_CODED_CREDENTIALS_ENABLED', OAUTH_HARD_CODED_CREDENTIALS_ENABLED],
      ['BEGIN_ALLOWED_SCHOOL_YEAR', BEGIN_ALLOWED_SCHOOL_YEAR],
      ['END_ALLOWED_SCHOOL_YEAR', END_ALLOWED_SCHOOL_YEAR],
      ['AUTHORIZATION_STORE_PLUGIN', AUTHORIZATION_STORE_PLUGIN],
    ])('retrieves the value of %s', (k, v) => {
      expect(Config.get(k as ConfigKeys)).toBe(v);
    });
  });

  describe('given a key that has not been set and has a default value', () => {
    let Config: any;

    beforeAll(async () => {
      setAllValues();
      process.env.MONGO_LOG_LEVEL = undefined;
      process.env.MONGO_URL = undefined;
      process.env.MONGO_WRITE_CONCERN = undefined;
      process.env.MONGO_READ_CONCERN = undefined;
      process.env.POSTGRES_HOST = undefined;
      process.env.POSTGRES_PORT = undefined;
      process.env.POSTGRES_USER = undefined;
      process.env.POSTGRES_PASSWORD = undefined;
      process.env.MEADOWLARK_DATABASE_NAME = undefined;
      process.env.LISTENER1_PLUGIN = undefined;
      process.env.LISTENER2_PLUGIN = undefined;
      process.env.QUERY_HANDLER_PLUGIN = undefined;
      process.env.ALLOW_TYPE_COERCION = undefined;
      process.env.ALLOW__EXT_PROPERTY = undefined;
      process.env.FASTIFY_NUM_THREADS = undefined;
      process.env.OAUTH_EXPIRATION_MINUTES = undefined;
      process.env.OAUTH_TOKEN_ISSUER = undefined;
      process.env.OAUTH_TOKEN_AUDIENCE = undefined;
      process.env.OAUTH_HARD_CODED_CREDENTIALS_ENABLED = undefined;
      process.env.BEGIN_ALLOWED_SCHOOL_YEAR = undefined;
      process.env.END_ALLOWED_SCHOOL_YEAR = undefined;
      process.env.OPENSEARCH_USERNAME = undefined;
      process.env.OPENSEARCH_PASSWORD = undefined;

      Config = await import('../src/Config');
      const Environment = await import('../src/Environment');
      await Config.initializeConfig(Environment.CachedEnvironmentConfigProvider);
    });

    afterAll(() => {
      setAllValues();
    });

    it.each([
      ['MONGO_LOG_LEVEL', 'error'],
      ['MONGO_URL', 'mongodb://mongo1:27017,mongo2:27018,mongo3:27019/?replicaSet=rs0'],
      ['MONGO_WRITE_CONCERN', 'majority'],
      ['MONGO_READ_CONCERN', 'majority'],
      ['POSTGRES_HOST', 'localhost'],
      ['POSTGRES_PORT', 5432],
      ['POSTGRES_USER', ''],
      ['POSTGRES_PASSWORD', ''],
      ['MEADOWLARK_DATABASE_NAME', 'meadowlark'],
      ['LISTENER1_PLUGIN', ''],
      ['LISTENER2_PLUGIN', ''],
      ['QUERY_HANDLER_PLUGIN', ''],
      ['ALLOW_TYPE_COERCION', false],
      ['ALLOW__EXT_PROPERTY', false],
      ['FASTIFY_NUM_THREADS', CpuCount],
      ['OAUTH_EXPIRATION_MINUTES', 60],
      ['OAUTH_TOKEN_ISSUER', 'edfi-meadowlark-issuer'],
      ['OAUTH_TOKEN_AUDIENCE', 'edfi-meadowlark-audience'],
      ['OAUTH_HARD_CODED_CREDENTIALS_ENABLED', false],
      ['BEGIN_ALLOWED_SCHOOL_YEAR', 1900],
      ['END_ALLOWED_SCHOOL_YEAR', 2100],
    ])('retrieves default value for %s', (k, v) => {
      expect(Config.get(k as ConfigKeys)).toBe(v);
    });
  });

  describe('given a key that has not been set and does not have a default value', () => {
    it.each([
      ['AUTHORIZATION_STORE_PLUGIN'],
      ['DOCUMENT_STORE_PLUGIN'],
      ['OPENSEARCH_ENDPOINT'],
      ['OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST'],
      ['OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION'],
      ['OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH'],
      ['OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH'],
    ])('throws an error for %s', (k) => {
      setAllValues();
      process.env[k] = undefined;

      const act = async (): Promise<void> => {
        const Config = await import('../src/Config');
        const Environment = await import('../src/Environment');
        await Config.initializeConfig(Environment.CachedEnvironmentConfigProvider);
      };

      act().catch((e) =>
        expect(e).toMatchInlineSnapshot(`[Error: Environment variable '${k}' has not been setup properly.]`),
      );
    });
  });
});
