// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import path from 'path';
import { DockerComposeEnvironment, StartedDockerComposeEnvironment } from 'testcontainers';
import dotenv from 'dotenv';
import { Logger } from 'packages/meadowlark-utilities';

const containerName = 'opensearch-integration-test';
const envFilePath = path.join(__dirname, '.env');
let environment: StartedDockerComposeEnvironment;
dotenv.config({ path: envFilePath });

export async function start() {
  const port = 8200;
  const composeFile = 'docker-compose.yml';
  const composeFilePath = path.resolve(__dirname, './');
  Logger.info('-- Setup OpenSearch environment --', null);
  environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
    .withNoRecreate()
    .withStartupTimeout(120_000)
    .up();
  const container = await environment.getContainer(containerName);
  const host = await container.getHost();
  process.env.OPENSEARCH_ENDPOINT = `http://${host}:${port}`;
  process.env.OPENSEARCH_USERNAME = 'admin';
  process.env.OPENSEARCH_PASSWORD = 'admin';
  process.env.OPENSEARCH_REQUEST_TIMEOUT = '10000';
}

export async function stop() {
  Logger.info('-- Tearing down OpenSearch environment --', null);
  await environment.getContainer(containerName).stop();
}
