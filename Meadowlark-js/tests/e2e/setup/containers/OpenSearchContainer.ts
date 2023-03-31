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
    startedContainer = await new GenericContainer(
      'opensearchproject/opensearch:2.5.0@sha256:f077efb452be64d3df56d74fe99fd63244704896edf6ead73a0f5decb95a40bf',
    )
      .withName('opensearch-test')
      .withNetwork(network)
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
  } catch (error) {
    throw new Error(`\nUnexpected error setting up open search container:\n${error}`);
  }

  await setOpenSearchLog(startedContainer);
}

export async function stop(): Promise<void> {
  await startedContainer.stop();
}
