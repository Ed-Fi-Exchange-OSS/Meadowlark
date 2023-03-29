// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { GenericContainer, StartedTestContainer } from 'testcontainers';

let startedContainer: StartedTestContainer;

export async function setup() {
  const openSearchPort = parseInt(process.env.OPENSEARCH_PORT ?? '8201', 10);
  startedContainer = await new GenericContainer(
    'opensearchproject/opensearch:2.5.0@sha256:f077efb452be64d3df56d74fe99fd63244704896edf6ead73a0f5decb95a40bf',
  )
    .withName('opensearch-test')
    .withExposedPorts({
      container: openSearchPort,
      host: openSearchPort,
    })
    .withEnvironment({
      'discovery.type': 'single-node',
      DISABLE_INSTALL_DEMO_CONFIG: 'true',
      DISABLE_SECURITY_PLUGIN: 'true',
      'http.port': `${openSearchPort}`,
    })
    .withStartupTimeout(120_000)
    .start();

  process.env.OPENSEARCH_ENDPOINT = `http://localhost:${openSearchPort}`;
  process.env.OPENSEARCH_USERNAME = 'admin';
  process.env.OPENSEARCH_PASSWORD = 'admin';
  process.env.OPENSEARCH_REQUEST_TIMEOUT = '10000';
}

export async function stop(): Promise<void> {
  await startedContainer.stop();
}
