// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DeleteRequest,
  DeleteResult,
  newSecurity,
  NoDocumentInfo,
  PaginationParameters,
  QueryRequest,
  ResourceInfo,
  UpdateResult,
  UpsertRequest,
  UpsertResult,
} from '@edfi/meadowlark-core';
import { Client } from '@opensearch-project/opensearch/.';
import { getNewClient } from '../../src/repository/Db';
import { queryDocuments } from '../../src/repository/QueryOpensearch';
import {
  afterDeleteDocumentById,
  afterUpdateDocumentById,
  afterUpsertDocument,
} from '../../src/repository/UpdateOpensearch';
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

  beforeAll(async () => {
    await setupOpenSearch();
    client = await getNewClient();
  });

  afterAll(async () => {
    await teardownOpenSearch();
  });

  describe('when insert was successful', () => {
    beforeEach(async () => {
      await afterUpsertDocument(
        newUpsertRequest,
        {
          response: 'INSERT_SUCCESS',
        } as UpsertResult,
        client,
      );
    });

    afterEach(async () => {
      await afterDeleteDocumentById(
        { id, resourceInfo } as DeleteRequest,
        { response: 'DELETE_SUCCESS' } as DeleteResult,
        client,
      );
    });

    it('should be created', async () => {
      const response = await queryDocuments(setupQueryRequest({}, {}), client);

      expect(response.documents).toEqual(expect.arrayContaining([expect.objectContaining({ id })]));
    });
  });

  describe('when update was successful', () => {
    beforeEach(async () => {
      newUpsertRequest.traceId = 'tracer2';
      await afterUpsertDocument(
        newUpsertRequest,
        {
          response: 'UPDATE_SUCCESS',
        } as UpsertResult,
        client,
      );
    });

    afterEach(async () => {
      await afterDeleteDocumentById(
        { id, resourceInfo } as DeleteRequest,
        { response: 'DELETE_SUCCESS' } as DeleteResult,
        client,
      );
    });

    it('should be updated', async () => {
      const response = await queryDocuments(setupQueryRequest({}, {}), client);

      expect(response.documents).toEqual(expect.arrayContaining([expect.objectContaining({ id })]));
    });
  });

  describe('when response was not successful', () => {
    it.each([
      'INSERT_FAILURE_REFERENCE',
      'INSERT_FAILURE_CONFLICT',
      'UPDATE_FAILURE_REFERENCE',
      'UPSERT_FAILURE_AUTHORIZATION',
      'UNKNOWN_FAILURE',
    ])('should not insert when result is %s', async (response) => {
      await afterUpsertDocument(
        newUpsertRequest,
        {
          response,
        } as UpsertResult,
        client,
      );

      const result = await queryDocuments(setupQueryRequest({}, {}), client);

      expect(result.documents).toHaveLength(0);
    });
  });

  describe('when updating by id is successful', () => {
    beforeEach(async () => {
      await afterUpdateDocumentById(
        newUpsertRequest,
        {
          response: 'UPDATE_SUCCESS',
        } as UpdateResult,
        client,
      );
    });

    afterEach(async () => {
      await afterDeleteDocumentById(
        { id, resourceInfo } as DeleteRequest,
        { response: 'DELETE_SUCCESS' } as DeleteResult,
        client,
      );
    });

    it('should be updated', async () => {
      const response = await queryDocuments(setupQueryRequest({}, {}), client);

      expect(response.documents).toEqual(expect.arrayContaining([expect.objectContaining({ id })]));
    });
  });

  describe('when updating should not be saved', () => {
    it.each(['UPDATE_FAILURE_REFERENCE', 'UPDATE_FAILURE_NOT_EXISTS', 'UPDATE_FAILURE_AUTHORIZATION', 'UNKNOWN_FAILURE'])(
      'should not update when result is %s',
      async (response) => {
        await afterUpdateDocumentById(
          newUpsertRequest,
          {
            response,
          } as UpdateResult,
          client,
        );

        const result = await queryDocuments(setupQueryRequest({}, {}), client);

        expect(result.documents).toHaveLength(0);
      },
    );
  });
});
