// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import path from 'path';

import { DockerComposeEnvironment, StartedDockerComposeEnvironment, StartedTestContainer, Wait } from 'testcontainers';
import fs from 'fs-extra';

let environment: StartedDockerComposeEnvironment;
let apiWriteStream: fs.WriteStream;
let mongoWriteStream: fs.WriteStream;
let opSearchWriteStream: fs.WriteStream;
let pgWriteStream: fs.WriteStream;

const mongoContainerName = 'mongo-test1';
const apiContainerName = 'meadowlark-api-test';
const opSearchContainerName = 'opensearch-test';
const pgContainerName = 'postgres-test';

function endLog() {
  if (apiWriteStream) {
    apiWriteStream.end();
  }
  if (mongoWriteStream) {
    mongoWriteStream.end();
  }
  if (opSearchWriteStream) {
    opSearchWriteStream.end();
  }
  if (pgWriteStream) {
    pgWriteStream.end();
  }
}

export async function stop() {
  endLog();
  console.info('-- Tearing down environment --');
  await environment.stop();
  await environment.down();
}

async function setLogTracing() {
  const apiStream = await environment.getContainer(apiContainerName).logs();
  apiWriteStream = fs.createWriteStream('./tests/e2e/logs/meadowlark-api.log');

  apiStream.on('data', (line) => apiWriteStream.write(line)).on('err', (line) => apiWriteStream.write(line));

  const mongoStream = await environment.getContainer(mongoContainerName).logs();
  mongoWriteStream = fs.createWriteStream('./tests/e2e/logs/mongo.log');

  mongoStream.on('data', (line) => mongoWriteStream.write(line)).on('err', (line) => mongoWriteStream.write(line));

  const osStream = await environment.getContainer(opSearchContainerName).logs();
  opSearchWriteStream = fs.createWriteStream('./tests/e2e/logs/openSearch.log');

  osStream.on('data', (line) => opSearchWriteStream.write(line)).on('err', (line) => opSearchWriteStream.write(line));

  const pgStream = await environment.getContainer(pgContainerName).logs();
  pgWriteStream = fs.createWriteStream('./tests/e2e/logs/pg.log');

  pgStream.on('data', (line) => pgWriteStream.write(line)).on('err', (line) => pgWriteStream.write(line));
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
  const composeFilePath = path.resolve(process.cwd(), './tests/e2e/setup/');
  const composeFile = 'docker-compose.yml';
  environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
    .withWaitStrategy(mongoContainerName, Wait.forHealthCheck())
    .withStartupTimeout(30 * 1000)
    .up();

  console.debug('-- Setting log tracing --');
  await setLogTracing();
  const mongoContainer = environment.getContainer(mongoContainerName);
  console.debug('-- Setting up mongo user --');
  await setMongoUser(mongoContainer);
}
