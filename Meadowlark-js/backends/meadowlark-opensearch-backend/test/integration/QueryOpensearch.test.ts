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
import { DocumentUuid, MeadowlarkId, TraceId } from '@edfi/meadowlark-core/src/model/IdTypes';
import { generateDocumentUuid } from '@edfi/meadowlark-core/src/model/DocumentIdentity';
import { Client } from '@opensearch-project/opensearch/.';
import { queryDocuments } from '../../src/repository/QueryOpensearch';
import { afterDeleteDocumentById, afterUpsertDocument } from '../../src/repository/UpdateOpensearch';
import { getNewTestClient } from '../setup/OpenSearchSetupEnvironment';

jest.setTimeout(120_000);

const resourceInfo: ResourceInfo = {
  projectName: 'ed-fi',
  resourceName: 'student',
  isDescriptor: false,
  resourceVersion: '3.3.1-b',
  allowIdentityUpdates: false,
};

const student1 = {
  studentUniqueId: '123fer58',
  firstName: 'First',
  lastSurname: 'Student',
  birthDate: '2001-01-01',
  birthCountryDescriptor: 'uri://ed-fi.org/CountryDescriptor#US',
};

const student1DocumentUuid: DocumentUuid = generateDocumentUuid();
const student1MeadowlarkId: MeadowlarkId = 'student1-123' as MeadowlarkId;

const student2 = {
  studentUniqueId: '123fer58',
  firstName: 'Second',
  lastSurname: 'Student',
  birthDate: '2001-01-01',
  birthCountryDescriptor: 'uri://ed-fi.org/CountryDescriptor#US',
};

const student2DocumentUuid: DocumentUuid = generateDocumentUuid();
const student2MeadowlarkId: MeadowlarkId = 'student2-456' as MeadowlarkId;

const security: Security = {
  authorizationStrategy: { type: 'FULL_ACCESS' } as AuthorizationStrategy,
  clientId: '1',
};

const setupUpsertRequest = (
  meadowlarkId: MeadowlarkId,
  edfiDoc = {},
  newResourceInfo = resourceInfo,
  documentInfo = NoDocumentInfo,
): UpsertRequest => ({
  meadowlarkId,
  resourceInfo: newResourceInfo,
  documentInfo,
  edfiDoc,
  validateDocumentReferencesExist: false,
  security,
  traceId: 'traceId' as TraceId,
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
  traceId: 'tracer' as TraceId,
});

describe('When querying for documents', () => {
  let client: Client;

  beforeAll(async () => {
    client = await getNewTestClient();

    await afterUpsertDocument(
      setupUpsertRequest(student1MeadowlarkId, student1),
      {
        response: 'INSERT_SUCCESS',
        newDocumentUuid: student1DocumentUuid,
      } as UpsertResult,
      client,
    );

    await afterUpsertDocument(
      setupUpsertRequest(student2MeadowlarkId, student2),
      {
        response: 'INSERT_SUCCESS',
        newDocumentUuid: student2DocumentUuid,
      } as UpsertResult,
      client,
    );
  });

  afterAll(async () => {
    client = await getNewTestClient();
    await afterDeleteDocumentById(
      { documentUuid: student1DocumentUuid, resourceInfo } as DeleteRequest,
      { response: 'DELETE_SUCCESS' } as DeleteResult,
      client,
    );

    await afterDeleteDocumentById(
      { documentUuid: student2DocumentUuid, resourceInfo } as DeleteRequest,
      { response: 'DELETE_SUCCESS' } as DeleteResult,
      client,
    );
  });

  describe('when querying with parameters', () => {
    describe('when querying with wrong resource info', () => {
      it('should return invalid query', async () => {
        const invalidResourceInfo = { ...resourceInfo };
        invalidResourceInfo.projectName = 'wrong-project';
        const result = await queryDocuments(setupQueryRequest({}, {}, invalidResourceInfo), client);

        expect(result.response).toEqual('QUERY_FAILURE_INDEX_NOT_FOUND');
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
        expect(result.documents[0]).toEqual({ ...student1, id: student1DocumentUuid });
        expect(result.documents[1]).toEqual({ ...student2, id: student2DocumentUuid });
      });
    });

    describe('when querying with valid parameters', () => {
      it('should return value', async () => {
        const result = await queryDocuments(setupQueryRequest({ firstName: student1.firstName }, {}), client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(1);
        expect(result.documents[0]).toEqual({ ...student1, id: student1DocumentUuid });
      });
    });

    describe('when querying with limit', () => {
      it('should return value', async () => {
        const result = await queryDocuments(setupQueryRequest({}, { limit: 1 }), client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(2);
        expect(result.documents).toHaveLength(1);
        expect(result.documents[0]).toEqual({ ...student1, id: student1DocumentUuid });
      });
    });

    describe('when querying with limit and offset', () => {
      it('should return value', async () => {
        const result = await queryDocuments(setupQueryRequest({}, { limit: 1, offset: 1 }), client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(2);
        expect(result.documents).toHaveLength(1);
        expect(result.documents[0]).toEqual({ ...student2, id: student2DocumentUuid });
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
        allowIdentityUpdates: false,
      };

      const queryRequest: QueryRequest = {
        resourceInfo: descriptorResourceInfo,
        queryParameters: {},
        paginationParameters: {},
        security: ownershipSecurity,
        traceId: 'tracer' as TraceId,
      };

      const descriptorDocumentUuid: DocumentUuid = generateDocumentUuid();
      const descriptorMeadowlarkId: MeadowlarkId = 'desc-123' as MeadowlarkId;

      const descriptorUpsertRequest: UpsertRequest = {
        meadowlarkId: descriptorMeadowlarkId,
        resourceInfo: descriptorResourceInfo,
        documentInfo: NoDocumentInfo,
        edfiDoc: {},
        validateDocumentReferencesExist: false,
        security: ownershipSecurity,
        traceId: 'traceId' as TraceId,
      };

      beforeAll(async () => {
        await afterUpsertDocument(
          descriptorUpsertRequest,
          {
            response: 'INSERT_SUCCESS',
            newDocumentUuid: descriptorDocumentUuid,
          } as UpsertResult,
          client,
        );
      });

      afterAll(async () => {
        await afterDeleteDocumentById(
          { documentUuid: descriptorDocumentUuid, resourceInfo: descriptorResourceInfo } as DeleteRequest,
          { response: 'DELETE_SUCCESS' } as DeleteResult,
          client,
        );
      });

      it('should ignore security', async () => {
        const result = await queryDocuments(queryRequest, client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(1);
        expect(result.documents[0]).toEqual({ id: descriptorDocumentUuid });
      });
    });

    describe('when querying with ownership', () => {
      const queryRequest: QueryRequest = {
        resourceInfo,
        queryParameters: {},
        paginationParameters: {},
        security: ownershipSecurity,
        traceId: 'tracer' as TraceId,
      };

      it('should return empty array for different client', async () => {
        const result = await queryDocuments(queryRequest, client);

        expect(result.response).toEqual('QUERY_SUCCESS');
        expect(result.totalCount).toEqual(0);
      });
    });
  });
});
