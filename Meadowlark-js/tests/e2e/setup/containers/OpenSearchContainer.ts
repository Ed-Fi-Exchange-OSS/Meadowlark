// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { GenericContainer, StartedNetwork, StartedTestContainer } from 'testcontainers';
import { setOpenSearchLog } from '../LogConfig';

let startedContainer: StartedTestContainer;

export async function setup(network: StartedNetwork) {
  try {
    const openSearchPort = parseInt(process.env.OPENSEARCH_PORT ?? '8200', 10);
    const container = new GenericContainer(
      'opensearchproject/opensearch:2.7.0@sha256:55f1f67e7d3645aa838b63a589bce5645154ba275814e52d4638d371ca0f8cb5',
    )
      .withName('opensearch-test')
      .withNetwork(network)
      .withLogConsumer(async (stream) => setOpenSearchLog(stream))
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
      .withStartupTimeout(120_000);

    startedContainer = await container.start();
  } catch (error) {
    throw new Error(`\nUnexpected error setting up open search container:\n${error}`);
  }
}

export async function stop(): Promise<void> {
  await startedContainer.stop();
}
