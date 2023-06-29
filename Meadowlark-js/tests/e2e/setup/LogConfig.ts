// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import fs from 'fs-extra';
import { StartedTestContainer } from 'testcontainers';

let apiWriteStream: fs.WriteStream;
let mongoWriteStream: fs.WriteStream;
let opSearchWriteStream: fs.WriteStream;
let elasticSearchWriteStream: fs.WriteStream;
let pgWriteStream: fs.WriteStream;

const logFolder = './tests/e2e/logs';

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
  if (elasticSearchWriteStream) {
    elasticSearchWriteStream.end();
  }
  if (pgWriteStream) {
    pgWriteStream.end();
  }
}

export async function setMongoLog(container: StartedTestContainer) {
  try {
    const mongoStream = await container.logs();
    mongoWriteStream = fs.createWriteStream(`${logFolder}/mongo.log`);

    mongoStream.on('data', (line) => mongoWriteStream.write(line)).on('err', (line) => mongoWriteStream.write(line));
  } catch (error) {
    throw new Error(`\nUnexpected error setting up mongo logs:\n${error}`);
  }
}

export async function setAPILog(container: StartedTestContainer) {
  try {
    const apiStream = await container.logs();
    apiWriteStream = fs.createWriteStream(`${logFolder}/meadowlark-api.log`);

    apiStream.on('data', (line) => apiWriteStream.write(line)).on('err', (line) => apiWriteStream.write(line));
  } catch (error) {
    throw new Error(`\nUnexpected error setting up api logs:\n${error}`);
  }
}

export async function setOpenSearchLog(container: StartedTestContainer) {
  try {
    const osStream = await container.logs();
    opSearchWriteStream = fs.createWriteStream(`${logFolder}/openSearch.log`);

    osStream.on('data', (line) => opSearchWriteStream.write(line)).on('err', (line) => opSearchWriteStream.write(line));
  } catch (error) {
    throw new Error(`\nUnexpected error setting up open search logs:\n${error}`);
  }
}

export async function setElasticSearchLog(container: StartedTestContainer) {
  try {
    const osStream = await container.logs();
    elasticSearchWriteStream = fs.createWriteStream(`${logFolder}/elasticSearch.log`);

    osStream.on('data', (line) => elasticSearchWriteStream.write(line)).on('err', (line) => opSearchWriteStream.write(line));
  } catch (error) {
    throw new Error(`\nUnexpected error setting up elastic search logs:\n${error}`);
  }
}

export async function setPostgresLog(container: StartedTestContainer) {
  try {
    const pgStream = await container.logs();
    pgWriteStream = fs.createWriteStream(`${logFolder}/postgres.log`);

    pgStream.on('data', (line) => pgWriteStream.write(line)).on('err', (line) => pgWriteStream.write(line));
  } catch (error) {
    throw new Error(`\nUnexpected error setting up postgres logs:\n${error}`);
  }
}
