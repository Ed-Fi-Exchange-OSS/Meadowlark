// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const envConfig = require('./EnvironmentConfig');
const teardownServer = require('./ServerConfig');

async function endServer() {
  if (!teardownServer.wasServerAlreadyRunning()) {
    if (!process.env.GITHUB_ACTION) {
      await envConfig.getEnvironment().down();
    }

    process.exit(0);
  }
}

module.exports = async () => endServer();
