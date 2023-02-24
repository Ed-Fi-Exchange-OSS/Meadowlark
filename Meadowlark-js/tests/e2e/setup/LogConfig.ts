// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import fs from 'fs-extra';
import { StartedDockerComposeEnvironment } from 'testcontainers';

let postgresWriteStream: fs.WriteStream;
let openSearchWriteStream: fs.WriteStream;

const logFolder = './tests/e2e/logs';

const postgresContainerName = 'postgres-test';
const openSearchContainerName = 'opensearch-test';

export function endLog() {
  if (postgresWriteStream) {
    postgresWriteStream.end();
  }
  if (openSearchWriteStream) {
    openSearchWriteStream.end();
  }
}

export async function setLogTracing(environment: StartedDockerComposeEnvironment) {
  const postgresStream = await environment.getContainer(postgresContainerName).logs();
  postgresWriteStream = fs.createWriteStream(`${logFolder}/postgres.log`);

  postgresStream.on('data', (line) => postgresWriteStream.write(line)).on('err', (line) => postgresWriteStream.write(line));

  const osStream = await environment.getContainer(openSearchContainerName).logs();
  openSearchWriteStream = fs.createWriteStream(`${logFolder}/openSearch.log`);

  osStream.on('data', (line) => openSearchWriteStream.write(line)).on('err', (line) => openSearchWriteStream.write(line));
}
