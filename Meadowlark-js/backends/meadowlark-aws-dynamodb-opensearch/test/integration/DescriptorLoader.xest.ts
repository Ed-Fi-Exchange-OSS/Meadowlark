// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { promisify } from 'util';
import dynamodbLocal from 'dynamodb-localhost';
import { load as loadYaml } from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CreateTableInput, CreateTableCommand, CreateTableCommandOutput } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { loadDescriptors, DocumentStorePlugin, PluginLoader } from '@edfi/meadowlark-core';
import * as DynamoRepository from '../../src/BaseDynamoRepository';

jest.setTimeout(120000);

// An experiment in integration testing with a live DynamoDB instance
const TEST_DYNAMO_PORT = Math.floor(Math.random() * 2000) + 8000;
const tableName = 'edfi-meadowlark-test';
export const resourceYamlPath: string = resolve(
  __dirname,
  '../../../../services/meadowlark-aws-lambda/resources/resources.yml',
);

function loadCreateTableInputFromResourcesYaml(): CreateTableInput {
  const resourceYaml: any = loadYaml(readFileSync(resourceYamlPath, 'utf8'));
  const tableDefinition: CreateTableInput = resourceYaml.Resources.entityTable.Properties;
  return {
    ...tableDefinition,
    TableName: tableName,
    StreamSpecification: { ...tableDefinition.StreamSpecification, StreamEnabled: true },
  };
}

async function createTable(tableDefinition: CreateTableInput): Promise<CreateTableCommandOutput> {
  const dynamoDb = DynamoRepository.getDynamoDBClient();
  return dynamoDb.send(new CreateTableCommand(tableDefinition));
}

describe('given the set of descriptors to load into DynamoDB', () => {
  let mockBackendPlugin;
  beforeAll(async () => {
    // Set the getBackendPlugin to DynamoDB
    // eslint-disable-next-line global-require
    const dynamoPlugin: DocumentStorePlugin = require(`../../src/index`).initialize();
    mockBackendPlugin = jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue(dynamoPlugin);

    // Overwrite the dynamodb configuration with testing config
    Object.assign(DynamoRepository.dynamoOpts, {
      endpoint: `http://localhost:${TEST_DYNAMO_PORT}`,
      region: 'local/us-east-1',
    });
    Object.assign(DynamoRepository.tableOpts, { tableName });

    await promisify(dynamodbLocal.install)();

    dynamodbLocal.start({ port: TEST_DYNAMO_PORT, inMemory: true });

    // give local Dynamo time to start up
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((r) => setTimeout(r, 4000));

    const tableDefinition: CreateTableInput = loadCreateTableInputFromResourcesYaml();
    const result: CreateTableCommandOutput = await createTable(tableDefinition);
    expect(result.$metadata.httpStatusCode).toBe(200);

    await loadDescriptors();
  });

  afterAll(async () => {
    // Unload the backend plugin
    mockBackendPlugin.mockRestore();
    await dynamodbLocal.stop(TEST_DYNAMO_PORT);
  });

  it('has all descriptor items in DynamoDB', async () => {
    const dynamoDb = DynamoRepository.getDynamoDBClient();
    const descriptorItemResult = await dynamoDb.send(
      new ScanCommand({
        TableName: tableName,
      }),
    );
    expect(descriptorItemResult.$metadata.httpStatusCode).toBe(200);
    expect(descriptorItemResult.Items).toHaveLength(2968);
  });
});
