// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { GenericContainer, StartedNetwork, StartedTestContainer } from 'testcontainers';
import { setAPILog } from '../LogConfig';

let startedContainer: StartedTestContainer;

export async function setup(network: StartedNetwork) {
  let container: GenericContainer;

  const fastifyPort = parseInt(process.env.FASTIFY_PORT ?? '3001', 10);

  console.info(`Configuring Meadowlark API with docker image: ${process.env.API_IMAGE_NAME ?? 'meadowlark'}`);

  try {
    container = new GenericContainer(process.env.API_IMAGE_NAME ?? 'meadowlark')
      .withName('meadowlark-api-test')
      .withNetwork(network)
      .withLogConsumer(async (stream) => setAPILog(stream))
      .withExposedPorts({
        container: fastifyPort,
        host: fastifyPort,
      })
      .withEnvironment({
        OAUTH_SIGNING_KEY: process.env.OAUTH_SIGNING_KEY ?? '',
        OAUTH_HARD_CODED_CREDENTIALS_ENABLED: 'true',
        OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH: 'meadowlark_verify-only_key_1',
        OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH: 'meadowlark_verify-only_secret_1',
        OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST: `http://localhost:${fastifyPort}/local/oauth/token`,
        OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION: `http://localhost:${fastifyPort}/local/oauth/verify`,
        OPENSEARCH_USERNAME: 'admin',
        OPENSEARCH_PASSWORD: 'admin',
        OPENSEARCH_ENDPOINT: 'http://opensearch-test:8200',
        ELASTICSEARCH_ENDPOINT: 'http://elasticsearch-node-test:9200',
        ELASTICSEARCH_REQUEST_TIMEOUT: '10000',
        DOCUMENT_STORE_PLUGIN: process.env.DOCUMENT_STORE_PLUGIN ?? '@edfi/meadowlark-mongodb-backend',
        QUERY_HANDLER_PLUGIN: process.env.QUERY_HANDLER_PLUGIN ?? '@edfi/meadowlark-opensearch-backend',
        LISTENER1_PLUGIN: process.env.LISTENER1_PLUGIN ?? '@edfi/meadowlark-opensearch-backend',
        MONGO_URI: process.env.MONGO_URI ?? 'mongodb://mongo-t1:27017/?directConnection=true',
        FASTIFY_RATE_LIMIT: 'false',
        FASTIFY_PORT: `${fastifyPort}`,
        FASTIFY_NUM_THREADS: process.env.FASTIFY_NUM_THREADS ?? '10',
        MEADOWLARK_STAGE: 'local',
        LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
        LOG_PRETTY_PRINT: 'false',
        AUTHORIZATION_STORE_PLUGIN: process.env.AUTHORIZATION_STORE_PLUGIN ?? '@edfi/meadowlark-mongodb-backend',
        POSTGRES_HOST: 'pg-test',
        POSTGRES_USER: process.env.POSTGRES_USER ?? 'postgres',
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? 'abcdefgh1!',
        MEADOWLARK_DATABASE_NAME: process.env.MEADOWLARK_DATABASE_NAME ?? 'postgres',
      });

    startedContainer = await container.start();
  } catch (error) {
    if (error.statusCode === 404) {
      throw new Error(
        "\nAPI Image not found. Verify it exists or do an automatic generation of the 'meadowlark' image with `npm run test:e2e:build`\n",
      );
    }

    throw new Error(`\nUnexpected error setting up API container:\n${error}`);
  }
}

export async function stop(): Promise<void> {
  await startedContainer.stop();
}
