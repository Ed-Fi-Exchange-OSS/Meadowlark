// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import path from 'path';

import { DockerComposeEnvironment, StartedDockerComposeEnvironment, StartedTestContainer, Wait } from 'testcontainers';
import { endLog, setLogTracing } from './LogConfig';

let environment: StartedDockerComposeEnvironment;

const mongoContainerName = 'mongo-test1';

export async function stop() {
  endLog();
  console.info('-- Tearing down environment --');
  await environment.stop();
  await environment.down();
}

async function executeCommand(container: StartedTestContainer, script: string[]): Promise<string> {
  return container.exec(script).then((result) => {
    if (result.exitCode !== 0) {
      console.error(result.output);
      throw result.output;
    }
    return result.output;
  });
}

async function setMongoUser(mongoContainer: StartedTestContainer) {
  await executeCommand(mongoContainer, ['./scripts/mongo-rs-setup.sh']);

  await new Promise((r) => {
    setTimeout(r, 30 * 1000);
  });

  await executeCommand(mongoContainer, ['./scripts/mongo-user-setup.sh']);
}

export async function configure() {
  const composeFilePath = path.resolve(__dirname, './');
  const composeFile = 'docker-compose.yml';
  environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
    .withWaitStrategy(mongoContainerName, Wait.forHealthCheck())
    .withStartupTimeout(30 * 1000)
    .up();

  console.debug('-- Setting log tracing --');
  await setLogTracing(environment);
  const mongoContainer = environment.getContainer(mongoContainerName);
  console.debug('-- Setting up mongo user --');
  await setMongoUser(mongoContainer);
}
