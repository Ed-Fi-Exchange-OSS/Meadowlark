// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const elasticSearchEnvironmentSetup = require('./ElasticSearchSetupEnvironment');

async function setupElasticSearchIntegrationTestEnvironment() {
  try {
    // Setup elasticSearch environment for integration tests.
    await elasticSearchEnvironmentSetup.setupElasticSearch();
  } catch (error) {
    throw new Error(`Error setting up integration test environment: ${error}`);
  }
}

module.exports = async () => setupElasticSearchIntegrationTestEnvironment();
