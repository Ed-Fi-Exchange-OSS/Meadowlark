// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const path = require('path');
const dotenv = require('dotenv');

const credentialManager = require('../helpers/Credentials');
const service = require('../../../services/meadowlark-fastify/src/Service');

dotenv.config({ path: path.join(__dirname, '../.env') });

let serverInstance;

export function getServer() {
  return serverInstance;
}

async function setupServer() {
  serverInstance = service.buildService();
  try {
    let port: number = 3000;
    if (process.env.FASTIFY_PORT != null) {
      const possiblePort: number = parseInt(process.env.FASTIFY_PORT, 10);

      if (!Number.isNaN(possiblePort)) port = possiblePort;
    }

    process.env.MEADOWLARK_STAGE ?? 'local';

    await serverInstance.listen(port);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

module.exports = async () => {
  await setupServer();

  await credentialManager.authenticateAdmin();
  await credentialManager.createAutomationUsers();
};
