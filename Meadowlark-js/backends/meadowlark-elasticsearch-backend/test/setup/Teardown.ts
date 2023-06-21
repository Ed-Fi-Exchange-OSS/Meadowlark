// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
const elasticSearchEnvironmentTeardown = require('./ElasticSearchSetupEnvironment');

module.exports = async () => {
  try {
    // Setup elasticSearch environment for integration tests.
    await elasticSearchEnvironmentTeardown.teardownElasticSearch();
  } catch (error) {
    throw new Error(`Error Teardown: ${error}`);
  }
};
