// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const path = require('path');
const dotenv = require('dotenv');

const credentialManager = require('../helpers/Credentials');
const setupServer = require('./ServerConfig');
const setupEnvironment = require('./EnvironmentConfig');

dotenv.config({ path: path.join(__dirname, '../.env') });
// Load fastify environment
dotenv.config({ path: path.join(process.cwd(), './services/meadowlark-fastify/.env') });

module.exports = async (config) => {
  console.info(`\nRunning e2e tests with: ${process.env.DOCUMENT_STORE_PLUGIN}\n`);

  try {
    await setupEnvironment.configure(config);
  } catch (error) {
    throw new Error(`Unexpected error setting up environment. Verify that Docker is running ${error}`);
  }
  await setupServer.setup();

  await credentialManager.authenticateAdmin();
  await credentialManager.createAutomationUsers();
};
