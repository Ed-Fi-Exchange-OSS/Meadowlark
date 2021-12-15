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
import { GetCommand, GetCommandOutput } from '@aws-sdk/lib-dynamodb';
import * as DynamoRepository from '../../../../src/repository/BaseDynamoRepository';
import { createEntity } from '../../../../src/repository/DynamoEntityRepository';
import { EntityInfo, entityTypeStringFrom, newEntityInfo } from '../../../../src/model/EntityInfo';
import { sortKeyFromId } from '../../../../src/repository/BaseDynamoRepository';
import { documentIdForEntityInfo } from '../../../../src/helpers/DocumentId';
import { newSecurity } from '../../../../src/model/Security';

jest.setTimeout(120000);

// An experiment in integration testing with a live DynamoDB instance
const TEST_DYNAMO_PORT = Math.floor(Math.random() * 2000) + 8000;
const tableName = 'edfi-meadowlark-test';
export const resourceYamlPath: string = resolve(__dirname, '../../../../resources/resources.yml');

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

describe('given the PUT run successfully in DynamoDb', () => {
  const entityInfo: EntityInfo = {
    ...newEntityInfo(),
    edOrgId: 'edOrg id',
    entityName: 'test name',
    naturalKey: 'NK#a#natural#key',
    projectName: 'a#project#name',
    projectVersion: '1',
    studentId: '1',
    descriptorValues: [],
  };

  const id = documentIdForEntityInfo(entityInfo);
  const bodyEntry = 'test';

  beforeAll(async () => {
    // Overwrite the dynamodb configuration with testing config
    Object.assign(DynamoRepository.dynamoOpts, {
      endpoint: `http://localhost:${TEST_DYNAMO_PORT}`,
      region: 'local/us-east-1',
    });
    Object.assign(DynamoRepository.tableOpts, { tableName });

    await promisify(dynamodbLocal.install)();

    dynamodbLocal.start({ port: TEST_DYNAMO_PORT, inMemory: true });

    // give local Dynamo time to start up
    await new Promise((r) => setTimeout(r, 2000));

    const tableDefinition: CreateTableInput = loadCreateTableInputFromResourcesYaml();
    const result: CreateTableCommandOutput = await createTable(tableDefinition);
    expect(result.$metadata.httpStatusCode).toBe(200);

    await createEntity(
      id,
      entityInfo,
      { bodyEntry },
      { referenceValidation: false, descriptorValidation: false },
      { ...newSecurity(), isOwnershipEnabled: false },
      'correlationId',
    );
  });

  afterAll(async () => {
    await dynamodbLocal.stop(TEST_DYNAMO_PORT);
  });

  it('exists in DynamoDB', async () => {
    const dynamoDb = DynamoRepository.getDynamoDBClient();
    const getResult: GetCommandOutput = await dynamoDb.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          pk: entityTypeStringFrom(entityInfo),
          sk: sortKeyFromId(id),
        },
      }),
    );
    expect(getResult.Item?.info.bodyEntry).toBe(bodyEntry);
    expect(getResult.$metadata.httpStatusCode).toBe(200);
  });
});
