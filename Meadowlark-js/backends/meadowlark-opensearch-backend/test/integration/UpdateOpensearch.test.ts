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
import { getNewClient } from '../../src/repository/Db';
import { queryDocuments } from '../../src/repository/QueryOpensearch';
import { afterUpsertDocument } from '../../src/repository/UpdateOpensearch';
import { setupOpenSearch, teardownOpenSearch } from '../setup/OpenSearchSetup';

jest.setTimeout(120_000);

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

  beforeAll(async () => {
    await setupOpenSearch();

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
    await teardownOpenSearch();
  });
});
