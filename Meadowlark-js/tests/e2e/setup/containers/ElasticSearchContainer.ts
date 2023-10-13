// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { GenericContainer, StartedNetwork, StartedTestContainer } from 'testcontainers';
import { setElasticSearchLog } from '../LogConfig';

let startedContainer: StartedTestContainer;

export async function setup(network: StartedNetwork) {
  try {
    const elasticSearchPort = parseInt(process.env.ELASTICSEARCH_PORT ?? '9200', 10);
    const container = new GenericContainer(
      'docker.elastic.co/elasticsearch/elasticsearch:8.8.0@sha256:9aaa38551b4d9e655c54d9dc6a1dad24ee568c41952dc8cf1d4808513cfb5f65',
    )
      .withName('elasticsearch-node-test')
      .withNetwork(network)
      .withLogConsumer(async (stream) => setElasticSearchLog(stream))
      .withExposedPorts({
        container: elasticSearchPort,
        host: elasticSearchPort,
      })
      .withEnvironment({
        'node.name': 'es01',
        'cluster.name': 'elasticsearch-node1',
        'discovery.type': 'single-node',
        'xpack.security.enabled': 'false',
        ES_JAVA_OPTS: '-Xmx500m', // Limiting memory
      })
      .withStartupTimeout(120_000);

    startedContainer = await container.start();
  } catch (error) {
    throw new Error(`\nUnexpected error setting up elastic search container:\n${error}`);
  }
}

export async function stop(): Promise<void> {
  await startedContainer.stop();
}
