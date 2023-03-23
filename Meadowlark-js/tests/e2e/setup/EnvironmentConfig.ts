// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import path from 'path';

import { DockerComposeEnvironment, Network, StartedDockerComposeEnvironment, Wait } from 'testcontainers';
import { setupAPIContainer } from './containers/apiContainer';
import { setupMongoContainer } from './containers/mongoContainer';
import { endLog } from './LogConfig';

let environment: StartedDockerComposeEnvironment;

const mongoContainerName = 'mongo-test1';
const openSearchContainerName = 'opensearch-test';

export async function stop() {
  endLog();
  console.info('-- Tearing down environment --');
  await environment.stop();
  await environment.down();
}

export async function configure() {
  const composeFilePath = path.resolve(__dirname, './');
  const composeFile = 'docker-compose.yml';

  environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
    .withWaitStrategy(mongoContainerName, Wait.forHealthCheck())
    .withWaitStrategy(openSearchContainerName, Wait.forHealthCheck())
    .withStartupTimeout(120_000)
    .up();

  const net = await new Network().start();
  await setupMongoContainer(net);

  await setupAPIContainer(net);

  console.debug('-- Setting log tracing --');
  // await setLogTracing(environment);
  // const mongoContainer = environment.getContainer(mongoContainerName);
  // console.debug('-- Setting up mongo user --');
  // await setMongoUser(mongoContainer);
  // console.debug('-- Environment Ready --');
}
