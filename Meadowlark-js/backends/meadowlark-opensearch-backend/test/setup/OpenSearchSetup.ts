// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config } from '@edfi/meadowlark-utilities';
import path from 'path';
import { DockerComposeEnvironment, StartedDockerComposeEnvironment, StartedTestContainer } from 'testcontainers';

let environment: StartedDockerComposeEnvironment;
const containerName = 'opensearch-test';

export async function setupOpenSearch() {
  let container: StartedTestContainer;
  try {
    const port = 8200;
    const composeFile = 'docker-compose.yml';
    const composeFilePath = path.resolve(__dirname, './');
    environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
      .withNoRecreate()
      .withStartupTimeout(120_000)
      .up();
    container = environment.getContainer(containerName);
    const host = container.getHost();

    Config.set('OPENSEARCH_ENDPOINT', `http://${host}:${port}`);
    Config.set('OPENSEARCH_USERNAME', 'admin');
    Config.set('OPENSEARCH_PASSWORD', 'admin');
  } catch (e) {
    throw new Error(`Error setting up opensearch: ${e}`);
  }
}

export async function teardownOpenSearch() {
  await environment.getContainer(containerName).stop();
}
