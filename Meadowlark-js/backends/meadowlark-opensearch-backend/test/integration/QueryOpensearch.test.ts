// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  ResourceInfo,
  UpsertRequest,
  NoDocumentInfo,
  newSecurity,
  UpsertResult,
  DeleteRequest,
  DeleteResult,
  PaginationParameters,
  QueryRequest,
} from '@edfi/meadowlark-core';
import { Client } from '@opensearch-project/opensearch/.';
import { getNewClient } from '../../src/repository/Db';
import { queryDocuments } from '../../src/repository/QueryOpensearch';
import { afterUpsertDocument, afterDeleteDocumentById } from '../../src/repository/UpdateOpensearch';
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

describe('When querying for documents', () => {
  let client: Client;
  let deleteDocumentAfterTest = true;

  beforeAll(async () => {
    await setupOpenSearch();
    client = await getNewClient();
  });

  afterAll(async () => {
    await teardownOpenSearch();
  });

  describe("given there's a document added", () => {
    beforeEach(async () => {
      deleteDocumentAfterTest = true;
      await afterUpsertDocument(
        newUpsertRequest,
        {
          response: 'INSERT_SUCCESS',
        } as UpsertResult,
        client,
      );
    });

    afterEach(async () => {
      if (deleteDocumentAfterTest) {
        await afterDeleteDocumentById(
          { id, resourceInfo } as DeleteRequest,
          { response: 'DELETE_SUCCESS' } as DeleteResult,
          client,
        );
      }
    });

    it('should be able to retrieve the document', async () => {
      const response = await queryDocuments(setupQueryRequest({}, {}), client);
      expect(response).toMatchInlineSnapshot(`
        {
          "documents": [
            {
              "id": "1234a-5678b",
            },
          ],
          "response": "QUERY_SUCCESS",
          "totalCount": 1,
        }
      `);
    });

    describe('when querying with wrong resource info', () => {
      it('should return invalid query', async () => {
        deleteDocumentAfterTest = false;
        resourceInfo.projectName = 'wrong-project';
        const response = await queryDocuments(setupQueryRequest({}, {}), client);

        expect(response).toMatchInlineSnapshot(`
          {
            "documents": [],
            "response": "QUERY_FAILURE_INVALID_QUERY",
          }
        `);
      });
    });

    describe('when query with not existing data', () => {
      it('should return empty result', async () => {
        deleteDocumentAfterTest = false;
        const birthCity = 'Austin';
        const response = await queryDocuments(setupQueryRequest({ birthCity }, {}), client);

        expect(response).toMatchInlineSnapshot(`
          {
            "documents": [],
            "response": "QUERY_SUCCESS",
            "totalCount": 0,
          }
        `);
      });
    });
  });
});
