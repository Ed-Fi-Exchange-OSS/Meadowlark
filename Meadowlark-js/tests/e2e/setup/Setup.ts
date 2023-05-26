// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const path = require('path');
const dotenv = require('dotenv');

const credentialManager = require('../helpers/Credentials');
const setupEnvironment = require('./EnvironmentConfig');

dotenv.config({ path: path.join(__dirname, './.env') });

module.exports = async () => {
  console.time('Setup Time');

  console.debug('\n-- Configuring Environment --');

  const initialize = process.env.DEVELOPER_MODE !== 'true';

  await setupEnvironment.configure(initialize);

  process.env.ROOT_URL = `http://localhost:${process.env.FASTIFY_PORT ?? 3001}`;
  process.env.DOCUMENT_STORE_PLUGIN = process.env.DOCUMENT_STORE_PLUGIN ?? '@edfi/meadowlark-mongodb-backend';
  console.info(`\n🧪 Running e2e tests for ${process.env.ROOT_URL} with: ${process.env.DOCUMENT_STORE_PLUGIN} 🧪\n`);

  console.debug('-- Authenticating Admin --');
  await credentialManager.authenticateAdmin();

  console.debug('-- Creating Automation Users --');
  await credentialManager.createAutomationUsers();
  console.timeEnd('Setup Time');
};
