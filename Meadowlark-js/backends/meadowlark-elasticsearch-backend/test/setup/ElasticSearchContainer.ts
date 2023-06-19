// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { GenericContainer, StartedTestContainer } from 'testcontainers';

let startedContainer: StartedTestContainer;

export async function setup() {
  const elasticSearchPort = parseInt(process.env.ELASTICSEARCH_PORT ?? '9200', 10);
  startedContainer = await new GenericContainer(
    'docker.elastic.co/elasticsearch/elasticsearch:8.8.0@sha256:9aaa38551b4d9e655c54d9dc6a1dad24ee568c41952dc8cf1d4808513cfb5f65',
  )
    .withName('elasticsearch-node-test')
    .withExposedPorts({
      container: elasticSearchPort,
      host: elasticSearchPort,
    })
    .withEnvironment({
      'node.name': 'es01',
      'cluster.name': 'elasticsearch-node1',
      'discovery.type': 'single-node',
      'xpack.security.enabled': 'false',
    })
    .withStartupTimeout(120_000)
    .start();

  process.env.ELASTICSEARCH_ENDPOINT = `http://localhost:${elasticSearchPort}`;
  process.env.ELASTICSEARCH_REQUEST_TIMEOUT = '10000';
}

export async function stop(): Promise<void> {
  await startedContainer.stop();
}
