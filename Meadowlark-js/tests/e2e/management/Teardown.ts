// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const teardownServer = require('./ServerConfig');

async function endServer() {
  // const service = teardownServer.getServer();

  // return service.close();
  if (!teardownServer.wasServerAlreadyRunning()) {
    process.exit(0);
  }
}

module.exports = async () => endServer();
