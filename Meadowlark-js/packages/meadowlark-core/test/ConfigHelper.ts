// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config } from '@edfi/meadowlark-utilities';
import * as MeadowlarkUtilities from '@edfi/meadowlark-utilities';

export const setupMockConfiguration = (isDebug: boolean = false, disableAnonymization: boolean = false) => {
  jest.spyOn(Config, 'get').mockImplementation((key: Config.ConfigKeys) => {
    switch (key) {
      case 'FASTIFY_RATE_LIMIT':
        return 0;
      case 'FASTIFY_PORT':
        return 0;
      case 'MEADOWLARK_STAGE':
        return 'local';
      case 'LOG_PRETTY_PRINT':
        return true;
      case 'OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST':
        return 'https://a/b/oauth/token';
      case 'OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_TTL':
        return 10;
      case 'OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_MAX_ENTRIES':
        return 11;
      case 'DOCUMENT_STORE_PLUGIN':
        return '@edfi/meadowlark-mongodb-backend';
      case 'OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH':
        return 'meadowlark_verify-only_key_1';
      case 'OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH':
        return 'meadowlark_verify-only_secret_1';
      case 'QUERY_HANDLER_PLUGIN':
        return '@edfi/meadowlark-opensearch-backend';
      case 'LISTENER1_PLUGIN':
        return '@edfi/meadowlark-opensearch-backend';
      case 'LISTENER2_PLUGIN':
        return '';
      case 'AUTHORIZATION_STORE_PLUGIN':
        return '@edfi/meadowlark-mongodb-backend';
      case 'MONGO_URI':
        return 'mongodb://mongo:abcdefgh1!@mongo1:27017,mongo2:27018,mongo3:27019/?replicaSet=rs0';
      case 'LOG_LEVEL':
        return isDebug ? 'DEBUG' : 'ERROR';
      case 'DISABLE_LOG_ANONYMIZATION':
        return disableAnonymization;
      case 'LOG_TO_FILE':
        return false;
      case 'LOG_FILE_LOCATION':
        return '/var/log/';
      case 'MEADOWLARK_DATABASE_NAME':
        return 'meadowlark-test';
      case 'MONGO_WRITE_CONCERN':
        return 'mwc';
      case 'MONGO_READ_CONCERN':
        return 'mrc';
      default:
        throw new Error(`Key '${key}' not configured`);
    }
  });

  jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => isDebug);
};
