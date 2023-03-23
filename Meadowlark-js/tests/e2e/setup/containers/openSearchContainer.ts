// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { GenericContainer, StartedNetwork } from 'testcontainers';
import { setOpenSearchLog } from '../LogConfig';

export async function setupOpenSearchContainer(network: StartedNetwork) {
  const openSearchPort = process.env.OPENSEARCH_PORT ?? '8200';
  const container = await new GenericContainer(
    'opensearchproject/opensearch:2.5.0@sha256:f077efb452be64d3df56d74fe99fd63244704896edf6ead73a0f5decb95a40bf',
  )
    .withName('opensearch-test')
    .withNetwork(network)
    .withExposedPorts({
      container: parseInt(openSearchPort, 10),
      host: parseInt(openSearchPort, 10),
    })
    .withEnvironment({
      'discovery.type': 'single-node',
      DISABLE_INSTALL_DEMO_CONFIG: 'true',
      DISABLE_SECURITY_PLUGIN: 'true',
      'http.port': openSearchPort,
    })
    // .withHealthCheck({
    //   test: ['CMD', `curl -s http://localhost:${openSearchPort}/_cat/health >/dev/null || exit 1`],
    //   interval: 3000,
    //   timeout: 1000,
    //   retries: 50,
    // })
    // .withWaitStrategy(Wait.forHealthCheck())
    .withStartupTimeout(120_000)
    .start();

  await setOpenSearchLog(container);
}
