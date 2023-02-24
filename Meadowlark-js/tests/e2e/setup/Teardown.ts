// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const environment = require('./EnvironmentConfig');

async function endServer() {
  try {
    await environment.stop();
    // Fix
    process.exit(0);
  } catch (error) {
    console.info(error);
  }
}

module.exports = async () => endServer();
