// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  newSecurity,
  NoDocumentInfo,
  PaginationParameters,
  QueryRequest,
  ResourceInfo,
  UpsertRequest,
  UpsertResult,
} from '@edfi/meadowlark-core';
import { Client } from '@opensearch-project/opensearch/.';
import path from 'path';
import { DockerComposeEnvironment, StartedDockerComposeEnvironment, StartedTestContainer } from 'testcontainers';
import { getNewClient } from '../../src/repository/Db';
import { queryDocuments } from '../../src/repository/QueryOpensearch';
import { afterUpsertDocument } from '../../src/repository/UpdateOpensearch';

jest.setTimeout(40000);

const resourceInfo: ResourceInfo = {
  projectName: 'ed-fi',
  resourceName: 'student',
  isDescriptor: false,
  resourceVersion: '3.3.1-b',
};

const id = '1234a-5678b';

const newUpsertRequest: UpsertRequest = {
  id,
  resourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validate: false,
  security: { ...newSecurity() },
  traceId: 'traceId',
};

const setupQueryRequest = (queryParameters: any, paginationParameters: PaginationParameters): QueryRequest => ({
  resourceInfo,
  queryParameters,
  paginationParameters,
  security: { ...newSecurity() },
  traceId: 'tracer',
});

describe('given the upsert of a new document', () => {
  let client: Client;
  let upsertResult: UpsertResult;
  let container: StartedTestContainer;
  let environment: StartedDockerComposeEnvironment;

  beforeAll(async () => {
    try {
      const port = 8200;
      const composeFile = 'docker-compose.yml';
      const composeFilePath = path.resolve(__dirname, './');
      environment = await new DockerComposeEnvironment(composeFilePath, composeFile).up();
      container = environment.getContainer('opensearch-node-integration');
      const host = container.getHost();
      process.env.OPENSEARCH_ENDPOINT = `http://${host}:${port}`;
    } catch (e) {
      throw new Error(`Error setting up opensearch: ${e}`);
    }

    client = await getNewClient();
  });

  describe('when upsert was successful', () => {
    beforeAll(async () => {
      upsertResult = {
        response: 'INSERT_SUCCESS',
      } as UpsertResult;
      await afterUpsertDocument(newUpsertRequest, upsertResult, client);
    });

    it('should be created', async () => {
      const response = await queryDocuments(setupQueryRequest({}, {}), client);

      expect(response).toMatchInlineSnapshot(`
        {
          "documents": [
            {
              "id": "${id}",
            },
          ],
          "response": "QUERY_SUCCESS",
          "totalCount": 1,
        }
      `);
    });
  });

  afterAll(async () => {
    await container.stop();
    // await environment.stop();
    // await environment.down();
  });
});
