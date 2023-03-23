// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { resolve } from 'path';
import { GenericContainer, StartedNetwork } from 'testcontainers';
import { setAPILog } from '../LogConfig';

async function generateContainerWithImage(): Promise<GenericContainer> {
  let apiContainer: GenericContainer;

  console.time('API Image Setup');
  if (process.env.USE_EXISTING_API_IMAGE) {
    console.info('Skipping image generation. Build image locally (npm run docker:build) or pull from Docker Hub');
    apiContainer = new GenericContainer(process.env.API_IMAGE_NAME ?? 'meadowlark');
  } else {
    console.info('Building image');
    apiContainer = await GenericContainer.fromDockerfile(resolve(process.cwd())).build();
  }
  console.timeEnd('API Image Setup');

  return apiContainer;
}

export async function setupAPIContainer(network: StartedNetwork) {
  const container = await generateContainerWithImage();

  const fastifyPort = process.env.FASTIFY_PORT ?? '3001';

  container
    .withName('meadowlark-api-test')
    .withNetwork(network)
    .withExposedPorts({
      container: parseInt(fastifyPort, 10),
      host: parseInt(fastifyPort, 10),
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
      DOCUMENT_STORE_PLUGIN: process.env.DOCUMENT_STORE_PLUGIN ?? '@edfi/meadowlark-mongodb-backend',
      QUERY_HANDLER_PLUGIN: '@edfi/meadowlark-opensearch-backend',
      LISTENER1_PLUGIN: '@edfi/meadowlark-opensearch-backend',
      MONGO_URI: process.env.MONGO_URI ?? 'mongodb://mongo-t1:27017/?directConnection=true',
      FASTIFY_RATE_LIMIT: 'false',
      FASTIFY_PORT: fastifyPort,
      FASTIFY_NUM_THREADS: process.env.FASTIFY_NUM_THREADS ?? '10',
      MEADOWLARK_STAGE: 'local',
      LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
      IS_LOCAL: 'false',
      AUTHORIZATION_STORE_PLUGIN: '@edfi/meadowlark-mongodb-backend',
    });

  const startedContainer = await container.start();
  await setAPILog(startedContainer);
}
