// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const { join } = require('path');
const dotenv = require('dotenv');

const credentials = require('../helpers/Credentials');
// @ts-ignore
const environment = require('./SetupTestContainers');

if (process.env.USE_EXISTING_ENVIRONMENT) {
  dotenv.config({ path: join(process.cwd(), './services/meadowlark-fastify/.env') });
} else {
  const result = dotenv.config({ path: join(__dirname, './.env-e2e') });

  if (result.error) {
    throw new Error(`An error ocurred loading .env-e2e file:\n${result.error}`);
  }
}

module.exports = async () => {
  console.time('Setup Time');

  console.debug('\n-- Configuring Environment --');

  const initialize = process.env.DEVELOPER_MODE !== 'true';

  if (process.env.USE_EXISTING_ENVIRONMENT) {
    console.info('Using existing environment, Verify that variables are set');
  } else {
    try {
      await environment.configure(initialize);
    } catch (error) {
      throw new Error(`⚠️ Error initializing containers.⚠️\n${error}`);
    }
  }

  process.env.ROOT_URL = `http://localhost:${process.env.FASTIFY_PORT ?? 3001}`;
  process.env.DOCUMENT_STORE_PLUGIN = process.env.DOCUMENT_STORE_PLUGIN ?? '@edfi/meadowlark-mongodb-backend';
  console.info(`\n🧪 Running e2e tests for ${process.env.ROOT_URL} with: ${process.env.DOCUMENT_STORE_PLUGIN} 🧪\n`);

  console.debug('-- Authenticating Admin --');
  await credentials.authenticateAdmin();

  console.debug('-- Creating Automation Users --');
  await credentials.createAutomationUsers();
  console.timeEnd('Setup Time');
};
