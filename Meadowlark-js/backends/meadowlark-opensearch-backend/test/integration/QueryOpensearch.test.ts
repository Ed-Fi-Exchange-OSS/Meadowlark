// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  ResourceInfo,
  UpsertRequest,
  NoDocumentInfo,
  UpsertResult,
  PaginationParameters,
  QueryRequest,
  Security,
  AuthorizationStrategy,
  DeleteRequest,
  DeleteResult,
} from '@edfi/meadowlark-core';
import { Client } from '@opensearch-project/opensearch/.';
import { getNewClient } from '../../src/repository/Db';
import { queryDocuments } from '../../src/repository/QueryOpensearch';
import { afterDeleteDocumentById, afterUpsertDocument } from '../../src/repository/UpdateOpensearch';
import { setupOpenSearch, teardownOpenSearch } from '../setup/OpenSearchSetup';

jest.setTimeout(120_000);

const resourceInfo: ResourceInfo = {
  projectName: 'ed-fi',
  resourceName: 'student',
  isDescriptor: false,
  resourceVersion: '3.3.1-b',
};

const student1 = {
  studentUniqueId: '123fer58',
  firstName: 'First',
  lastSurname: 'Student',
  birthDate: '2001-01-01',
  birthCountryDescriptor: 'uri://ed-fi.org/CountryDescriptor#US',
  id: '1234a-5678a',
};

const student2 = {
  studentUniqueId: '123fer58',
  firstName: 'Second',
  lastSurname: 'Student',
  birthDate: '2001-01-01',
  birthCountryDescriptor: 'uri://ed-fi.org/CountryDescriptor#US',
  id: '1234a-5678b',
};

const security: Security = {
  authorizationStrategy: { type: 'FULL_ACCESS' } as AuthorizationStrategy,
  clientId: '1',
};

const setupUpsertRequest = (
  id: string,
  edfiDoc = {},
  newResourceInfo = resourceInfo,
  documentInfo = NoDocumentInfo,
): UpsertRequest => ({
  id,
  resourceInfo: newResourceInfo,
  documentInfo,
  edfiDoc,
  validate: false,
  security,
  traceId: 'traceId',
});

const setupQueryRequest = (
  queryParameters: any,
  paginationParameters: PaginationParameters,
  newResourceInfo = resourceInfo,
): QueryRequest => ({
  resourceInfo: newResourceInfo,
  queryParameters,
  paginationParameters,
  security,
  traceId: 'tracer',
});

describe('When querying for documents', () => {
  let client: Client;

  beforeAll(async () => {
    await setupOpenSearch();
    client = await getNewClient();

    await afterUpsertDocument(
      setupUpsertRequest(student1.id, student1),
      {
        response: 'INSERT_SUCCESS',
      } as UpsertResult,
      client,
    );

    await afterUpsertDocument(
      setupUpsertRequest(student2.id, student2),
      {
        response: 'INSERT_SUCCESS',
      } as UpsertResult,
      client,
    );
  });

  afterAll(async () => {
    await afterDeleteDocumentById(
      { id: student1.id, resourceInfo } as DeleteRequest,
      { response: 'DELETE_SUCCESS' } as DeleteResult,
      client,
    );

    await afterDeleteDocumentById(
      { id: student2.id, resourceInfo } as DeleteRequest,
      { response: 'DELETE_SUCCESS' } as DeleteResult,
      client,
    );

    await teardownOpenSearch();
  });

  describe('when querying with parameters', () => {
    describe('when querying with wrong resource info', () => {
      it('should return invalid query', async () => {
        const invalidResourceInfo = { ...resourceInfo };
        invalidResourceInfo.projectName = 'wrong-project';
        const result = await queryDocuments(setupQueryRequest({}, {}, invalidResourceInfo), client);

        expect(result.response).toEqual('QUERY_FAILURE_INVALID_QUERY');
        expect(result.documents).toHaveLength(0);
        expect(result.totalCount).toBeUndefined();
      });
    });

    describe('when querying with wrong property', () => {
      it('should return error message', async () => {
        const result = await queryDocuments(setupQueryRequest({ lastSure: 'Last' }, {}), client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(0);
        expect(result.documents).toHaveLength(0);
      });
    });

    describe('when querying with non existent data', () => {
      it('should return empty results', async () => {
        const result = await queryDocuments(setupQueryRequest({ firstName: 'Last' }, {}), client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(0);
        expect(result.documents).toHaveLength(0);
      });
    });

    describe('when querying without parameters', () => {
      it('should return all values', async () => {
        const result = await queryDocuments(setupQueryRequest({}, {}), client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(2);
        expect(result.documents[0]).toEqual(student1);
        expect(result.documents[1]).toEqual(student2);
      });
    });

    describe('when querying with valid parameters', () => {
      it('should return value', async () => {
        const result = await queryDocuments(setupQueryRequest({ firstName: student1.firstName }, {}), client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(1);
        expect(result.documents[0]).toEqual(student1);
      });
    });

    describe('when querying with limit', () => {
      it('should return value', async () => {
        const result = await queryDocuments(setupQueryRequest({}, { limit: 1 }), client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(2);
        expect(result.documents).toHaveLength(1);
        expect(result.documents[0]).toEqual(student1);
      });
    });

    describe('when querying with limit and offset', () => {
      it('should return value', async () => {
        const result = await queryDocuments(setupQueryRequest({}, { limit: 1, offset: 1 }), client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(2);
        expect(result.documents).toHaveLength(1);
        expect(result.documents[0]).toEqual(student2);
      });
    });

    describe('when querying with parameters and offset', () => {
      it('should return value', async () => {
        const result = await queryDocuments(
          setupQueryRequest({ firstName: student1.firstName }, { limit: 2, offset: 1 }),
          client,
        );

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(1);
        expect(result.documents).toHaveLength(0);
      });
    });

    describe('when querying with extra characters', () => {
      it("shouldn't return values", async () => {
        const result = await queryDocuments(
          setupQueryRequest({ firstName: "student1.firstName'%20or%20studentUniqueId%20is%20not%20null%20%23" }, {}),
          client,
        );

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(0);
        expect(result.documents).toHaveLength(0);
      });
    });
  });

  describe('when querying with ownership', () => {
    const ownershipSecurity: Security = {
      authorizationStrategy: { type: 'OWNERSHIP_BASED' } as AuthorizationStrategy,
      clientId: '2',
    };

    describe('when querying for descriptor', () => {
      const descriptorResourceInfo: ResourceInfo = {
        projectName: 'ed-fi',
        resourceName: 'countryDescriptor',
        isDescriptor: true,
        resourceVersion: '3.3.1-b',
      };

      const queryRequest: QueryRequest = {
        resourceInfo: descriptorResourceInfo,
        queryParameters: {},
        paginationParameters: {},
        security: ownershipSecurity,
        traceId: 'tracer',
      };

      const descriptorId = 'desc-123';

      const descriptorUpsertRequest: UpsertRequest = {
        id: descriptorId,
        resourceInfo: descriptorResourceInfo,
        documentInfo: NoDocumentInfo,
        edfiDoc: {},
        validate: false,
        security: ownershipSecurity,
        traceId: 'traceId',
      };

      beforeAll(async () => {
        await afterUpsertDocument(
          descriptorUpsertRequest,
          {
            response: 'INSERT_SUCCESS',
          } as UpsertResult,
          client,
        );
      });

      afterAll(async () => {
        await afterDeleteDocumentById(
          { id: descriptorId, resourceInfo: descriptorResourceInfo } as DeleteRequest,
          { response: 'DELETE_SUCCESS' } as DeleteResult,
          client,
        );
      });

      it('should ignore security', async () => {
        const result = await queryDocuments(queryRequest, client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(1);
        expect(result.documents[0]).toEqual({ id: descriptorId });
      });
    });

    describe('when querying with ownership', () => {
      const queryRequest: QueryRequest = {
        resourceInfo,
        queryParameters: {},
        paginationParameters: {},
        security: ownershipSecurity,
        traceId: 'tracer',
      };

      it('should return empty array for different client', async () => {
        const result = await queryDocuments(queryRequest, client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(0);
      });
    });
  });
});
