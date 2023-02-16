// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import fs from 'fs-extra';
import { StartedDockerComposeEnvironment } from 'testcontainers';

let apiWriteStream: fs.WriteStream;
let mongoWriteStream: fs.WriteStream;
let opSearchWriteStream: fs.WriteStream;

const logFolder = './tests/e2e/logs';

const mongoContainerName = 'mongo-test1';
const apiContainerName = 'meadowlark-api-test';
const opSearchContainerName = 'opensearch-test';

export function endLog() {
  if (apiWriteStream) {
    apiWriteStream.end();
  }
  if (mongoWriteStream) {
    mongoWriteStream.end();
  }
  if (opSearchWriteStream) {
    opSearchWriteStream.end();
  }
}

export async function setLogTracing(environment: StartedDockerComposeEnvironment) {
  const apiStream = await environment.getContainer(apiContainerName).logs();
  apiWriteStream = fs.createWriteStream(`${logFolder}/meadowlark-api.log`);

  apiStream.on('data', (line) => apiWriteStream.write(line)).on('err', (line) => apiWriteStream.write(line));

  const mongoStream = await environment.getContainer(mongoContainerName).logs();
  mongoWriteStream = fs.createWriteStream(`${logFolder}/mongo.log`);

  mongoStream.on('data', (line) => mongoWriteStream.write(line)).on('err', (line) => mongoWriteStream.write(line));

  const osStream = await environment.getContainer(opSearchContainerName).logs();
  opSearchWriteStream = fs.createWriteStream(`${logFolder}/openSearch.log`);

  osStream.on('data', (line) => opSearchWriteStream.write(line)).on('err', (line) => opSearchWriteStream.write(line));
}
