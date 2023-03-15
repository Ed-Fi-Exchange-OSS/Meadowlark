// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
const openSearchEnvironmentTeardown = require('../../../backends/meadowlark-opensearch-backend/test/setup/OpenSearchSetupEnvironment');

module.exports = async () => {
  try {
    console.log('****************--------------***********');
    // Setup openSearch environment for integration tests.
    await openSearchEnvironmentTeardown.teardownOpenSearch();
  } catch (error) {
    throw new Error(`Error Teardown: ${error}`);
  }
};
