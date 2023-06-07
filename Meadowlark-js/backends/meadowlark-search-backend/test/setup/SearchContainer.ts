// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { GenericContainer, StartedTestContainer } from 'testcontainers';

let startedContainer: StartedTestContainer;

async function setupElasticSearch() {
  const elasticSearchPort = parseInt(process.env.ELASTICSEARCH_PORT ?? '9200', 10);
  startedContainer = await new GenericContainer('docker.elastic.co/elasticsearch/elasticsearch:latest')
    .withName('elasticsearch-node-test')
    .withExposedPorts({
      container: elasticSearchPort,
      host: elasticSearchPort,
    })
    .withEnvironment({
      'node.name': 'es01',
      'cluster.name': 'elasticsearch-node1',
      'discovery.type': 'single-node',
      ELASTIC_PASSWORD: 'elasticpassword',
      'xpack.security.enabled': 'false',
    })
    .withStartupTimeout(120_000)
    .start();

  process.env.ELASTICSEARCH_ENDPOINT = `http://localhost:${elasticSearchPort}`;
  process.env.ELASTICSEARCH_USERNAME = 'admin';
  process.env.ELASTICSEARCH_PASSWORD = 'admin';
  process.env.ELASTICSEARCH_REQUEST_TIMEOUT = '10000';
}

async function setupOpenSeach() {
  const openSearchPort = parseInt(process.env.OPENSEARCH_PORT ?? '8201', 10);
  startedContainer = await new GenericContainer(
    'opensearchproject/opensearch:2.7.0@sha256:55f1f67e7d3645aa838b63a589bce5645154ba275814e52d4638d371ca0f8cb5',
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

export async function setup() {
  const searchType = 'opensearch'; // ToDo: Read this value from the env file?
  if (searchType === 'opensearch') {
    await setupOpenSeach();
  } else {
    await setupElasticSearch();
  }
}

export async function stop(): Promise<void> {
  await startedContainer.stop();
}
