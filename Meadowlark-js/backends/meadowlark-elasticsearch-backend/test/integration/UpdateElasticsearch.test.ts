// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DeleteRequest,
  DeleteResult,
  DocumentUuid,
  MeadowlarkId,
  newSecurity,
  NoDocumentInfo,
  PaginationParameters,
  QueryRequest,
  ResourceInfo,
  TraceId,
  UpdateRequest,
  UpdateResult,
  UpsertRequest,
  UpsertResult,
} from '@edfi/meadowlark-core';
import { Client } from '@elastic/elasticsearch';
import { queryDocuments } from '../../src/repository/QueryElasticsearch';
import {
  afterDeleteDocumentById,
  afterUpdateDocumentById,
  afterUpsertDocument,
} from '../../src/repository/UpdateElasticsearch';
import { getNewTestClient } from '../setup/ElasticSearchSetupEnvironment';

jest.setTimeout(120_000);

const resourceInfo: ResourceInfo = {
  projectName: 'ed-fi',
  resourceName: 'student',
  isDescriptor: false,
  resourceVersion: '3.3.1-b',
  allowIdentityUpdates: false,
};

const resourceIndex: string = 'ed-fi$3-3-1-b$student';

const meadowlarkId = '1234a-5678b' as MeadowlarkId;
const documentUuid: DocumentUuid = 'e6ce70aa-8216-46e9-b6a1-a3be70f72f36' as DocumentUuid;

const newUpsertRequest: UpsertRequest = {
  meadowlarkId,
  resourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: { upsert: true },
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
};

const newUpdateRequest: UpdateRequest = {
  meadowlarkId,
  documentUuid,
  resourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: { update: true },
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
};

const setupQueryRequest = (queryParameters: any, paginationParameters: PaginationParameters): QueryRequest => ({
  resourceInfo,
  queryParameters,
  paginationParameters,
  security: { ...newSecurity() },
  traceId: 'tracer' as TraceId,
});

describe('given the upsert of a new document', () => {
  let client: Client;

  beforeAll(async () => {
    client = await getNewTestClient();
  });

  describe('when insert was successful', () => {
    beforeEach(async () => {
      await afterUpsertDocument(
        newUpsertRequest,
        {
          response: 'INSERT_SUCCESS',
          newDocumentUuid: documentUuid,
        } as UpsertResult,
        client,
      );
    });

    afterEach(async () => {
      await client.indices.delete({ index: resourceIndex });
    });

    it('should be created', async () => {
      const response = await queryDocuments(setupQueryRequest({}, {}), client);
      expect(response.documents).toHaveLength(1);
      expect((response.documents[0] as any).upsert).toBe(true);
    });
  });

  describe('when update was successful', () => {
    beforeEach(async () => {
      newUpsertRequest.traceId = 'tracer2' as TraceId;
      await afterUpsertDocument(
        newUpsertRequest,
        {
          response: 'UPDATE_SUCCESS',
        } as UpsertResult,
        client,
      );
    });

    afterEach(async () => {
      await client.indices.delete({ index: resourceIndex });
    });

    it('should be updated', async () => {
      const response = await queryDocuments(setupQueryRequest({}, {}), client);
      expect(response.documents).toHaveLength(1);
      expect((response.documents[0] as any).upsert).toBe(true);
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

  describe('when updating by meadowlarkId is successful', () => {
    beforeEach(async () => {
      await afterUpdateDocumentById(
        newUpdateRequest,
        {
          response: 'UPDATE_SUCCESS',
        } as UpdateResult,
        client,
      );
    });

    afterEach(async () => {
      await client.indices.delete({ index: resourceIndex });
    });

    it('should be updated', async () => {
      const response = await queryDocuments(setupQueryRequest({}, {}), client);
      expect(response.documents).toHaveLength(1);
      expect((response.documents[0] as any).update).toBe(true);
    });
  });

  describe('when updating should not be saved', () => {
    it.each(['UPDATE_FAILURE_REFERENCE', 'UPDATE_FAILURE_NOT_EXISTS', 'UPDATE_FAILURE_AUTHORIZATION', 'UNKNOWN_FAILURE'])(
      'should not update when result is %s',
      async (response) => {
        await afterUpdateDocumentById(
          newUpdateRequest,
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

  describe('when deleting by meadowlarkId', () => {
    beforeEach(async () => {
      await afterUpdateDocumentById(
        newUpdateRequest,
        {
          response: 'UPDATE_SUCCESS',
        } as UpdateResult,
        client,
      );
    });

    afterEach(async () => {
      await client.indices.delete({ index: resourceIndex });
    });

    it('should be able to delete document', async () => {
      await afterDeleteDocumentById(
        { documentUuid, resourceInfo } as DeleteRequest,
        { response: 'DELETE_SUCCESS' } as DeleteResult,
        client,
      );

      const response = await queryDocuments(setupQueryRequest({}, {}), client);

      expect(response.documents).toHaveLength(0);
    });
  });
});
