// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { ApiError, ApiResponse, Client } from '@opensearch-project/opensearch';
import Mock from '@short.io/opensearch-mock';
import { PaginationParameters, QueryRequest, QueryResult } from '@edfi/meadowlark-core';
import { AuthorizationStrategy } from '@edfi/meadowlark-core/dist/security/Security';
import {
  TransportRequestCallback,
  TransportRequestParams,
  TransportRequestOptions,
} from '@opensearch-project/opensearch/lib/Transport';
import { queryDocuments } from '../src/repository/QueryOpensearch';

describe('when querying for students', () => {
  const setupMockRequestHappyPath = (uniqueIds: string[]): Client => {
    const mock = new Mock();
    const datarows = uniqueIds.map((x) => [`{"studentUniqueId": "${x}"}`]);

    mock.add(
      {
        method: 'POST',
        path: '/_opendistro/_sql',
      },
      () => ({
        schema: [
          {
            name: 'studentUniqueId',
            type: 'text',
          },
        ],
        total: 2,
        datarows,
      }),
    );

    const client = new Client({
      node: 'http://localhost:9200',
      Connection: mock.getConnection(),
    });
    return client;
  };

  const setupQueryRequest = (
    authorizationStrategy: AuthorizationStrategy,
    queryStringParameters: any,
    paginationParameters: PaginationParameters,
    clientName = 'hi',
  ): QueryRequest => ({
    resourceInfo: {
      projectName: 'ed-fi',
      resourceName: 'student',
      isDescriptor: false,
      resourceVersion: '3.3.1-b',
    },
    queryStringParameters,
    paginationParameters,
    security: { authorizationStrategy, clientName },
    traceId: 'tracer',
  });

  describe('given there are no students', () => {
    it('should return an empty array', async () => {
      // Arrange
      const client = setupMockRequestHappyPath([]);
      const request = setupQueryRequest('FULL_ACCESS', {}, {});

      // Act
      const result = await queryDocuments(request, client);

      // Assert
      expect(result.documents.length).toEqual(0);
    });
  });

  describe('given there are students', () => {
    describe('given full access authorization', () => {
      describe('given no query or pagination', () => {
        const authorizationStrategy = 'FULL_ACCESS';
        let queryResult: QueryResult;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo]);
          const request = setupQueryRequest(authorizationStrategy, {}, {});

          queryResult = await queryDocuments(request, client);
        });

        it('should return two students', async () => {
          expect(queryResult.documents.length).toBe(2);
        });

        it('should return the first student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdOne)).toBeGreaterThan(-1);
        });

        it('should return the second student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdTwo)).toBeGreaterThan(-1);
        });
      });

      describe('given two query terms', () => {
        const authorizationStrategy = 'FULL_ACCESS';
        let queryResult: QueryResult;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';
        let spyOnRequest: jest.SpyInstance<
          TransportRequestCallback,
          [
            params: TransportRequestParams,
            options?: TransportRequestOptions | undefined,
            callback?: ((err: ApiError, result: ApiResponse<Record<string, any>, unknown>) => void) | undefined,
          ]
        >;
        const birthCity = 'a';
        const birthDate = '2022-07-28';
        const expectedQuery =
          '{"query":"SELECT info FROM ed-fi$3-3-1-b$student WHERE birthCity = \'a\' AND birthDate = \'2022-07-28\' ORDER BY _doc"}';

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo]);
          const request = setupQueryRequest(authorizationStrategy, { birthCity, birthDate }, {});

          spyOnRequest = jest.spyOn(client.transport, 'request');

          queryResult = await queryDocuments(request, client);
        });

        it('should return two students', async () => {
          expect(queryResult.documents.length).toBe(2);
        });

        it('should return the first student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdOne)).toBeGreaterThan(-1);
        });

        it('should return the second student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdTwo)).toBeGreaterThan(-1);
        });

        it('should have used the correct SQL query', async () => {
          expect(spyOnRequest.mock.calls.length).toBe(1);
          expect(spyOnRequest.mock.calls[0].length).toBe(1);
          const { body } = spyOnRequest.mock.calls[0][0];
          expect(body).toBe(expectedQuery);
        });
      });

      describe('given page limits', () => {
        const authorizationStrategy = 'FULL_ACCESS';
        let queryResult: QueryResult;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';
        let spyOnRequest: jest.SpyInstance<
          TransportRequestCallback,
          [
            params: TransportRequestParams,
            options?: TransportRequestOptions | undefined,
            callback?: ((err: ApiError, result: ApiResponse<Record<string, any>, unknown>) => void) | undefined,
          ]
        >;
        const limit = '1';
        const offset = '2';
        const expectedQuery = '{"query":"SELECT info FROM ed-fi$3-3-1-b$student LIMIT 1 OFFSET 2 ORDER BY _doc"}';

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo]);
          const request = setupQueryRequest(authorizationStrategy, {}, { limit, offset });

          spyOnRequest = jest.spyOn(client.transport, 'request');

          queryResult = await queryDocuments(request, client);
        });

        it('should return two students', async () => {
          expect(queryResult.documents.length).toBe(2);
        });

        it('should return the first student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdOne)).toBeGreaterThan(-1);
        });

        it('should return the second student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdTwo)).toBeGreaterThan(-1);
        });

        it('should have used the correct SQL query', async () => {
          expect(spyOnRequest.mock.calls.length).toBe(1);
          expect(spyOnRequest.mock.calls[0].length).toBe(1);
          const { body } = spyOnRequest.mock.calls[0][0];
          expect(body).toBe(expectedQuery);
        });
      });

      describe('given both query terms and page limits', () => {
        const authorizationStrategy = 'FULL_ACCESS';
        let queryResult: QueryResult;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';
        let spyOnRequest: jest.SpyInstance<
          TransportRequestCallback,
          [
            params: TransportRequestParams,
            options?: TransportRequestOptions | undefined,
            callback?: ((err: ApiError, result: ApiResponse<Record<string, any>, unknown>) => void) | undefined,
          ]
        >;
        const birthCity = 'a';
        const birthDate = '2022-07-28';
        const limit = '1';
        const offset = '2';
        const expectedQuery =
          '{"query":"SELECT info FROM ed-fi$3-3-1-b$student WHERE birthCity = \'a\' AND birthDate = \'2022-07-28\' LIMIT 1 OFFSET 2 ORDER BY _doc"}';

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo]);
          const request = setupQueryRequest(authorizationStrategy, { birthCity, birthDate }, { limit, offset });

          spyOnRequest = jest.spyOn(client.transport, 'request');

          queryResult = await queryDocuments(request, client);
        });

        it('should return two students', async () => {
          expect(queryResult.documents.length).toBe(2);
        });

        it('should return the first student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdOne)).toBeGreaterThan(-1);
        });

        it('should return the second student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdTwo)).toBeGreaterThan(-1);
        });

        it('should have used the correct SQL query', async () => {
          expect(spyOnRequest.mock.calls.length).toBe(1);
          expect(spyOnRequest.mock.calls[0].length).toBe(1);
          const { body } = spyOnRequest.mock.calls[0][0];
          expect(body).toBe(expectedQuery);
        });
      });
    });

    describe('given ownership access authorization', () => {
      describe('given a query term with SQL injection attack to bypass authorization', () => {
        const authorizationStrategy = 'OWNERSHIP_BASED';
        let queryResult: QueryResult;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';
        let spyOnRequest: jest.SpyInstance<
          TransportRequestCallback,
          [
            params: TransportRequestParams,
            options?: TransportRequestOptions | undefined,
            callback?: ((err: ApiError, result: ApiResponse<Record<string, any>, unknown>) => void) | undefined,
          ]
        >;
        // Explanation: this attack attempts to retrieve all students, and comment out the rest of the query including the
        // clause limiting the search by ownership.
        const birthCity = `a' or studentUniqueId is not null #`;
        const expectedQuery = `{"query":"SELECT info FROM ed-fi$3-3-1-b$student WHERE birthCity = 'a\\\\' or studentUniqueId is not null #' AND createdBy = 'hi' ORDER BY _doc"}`;

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo]);
          const request = setupQueryRequest(authorizationStrategy, { birthCity }, {});

          spyOnRequest = jest.spyOn(client.transport, 'request');

          queryResult = await queryDocuments(request, client);
        });

        it('should return two students', async () => {
          expect(queryResult.documents.length).toBe(2);
        });

        it('should return the first student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdOne)).toBeGreaterThan(-1);
        });

        it('should return the second student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdTwo)).toBeGreaterThan(-1);
        });

        it('should have used the correct SQL query', async () => {
          expect(spyOnRequest.mock.calls.length).toBe(1);
          expect(spyOnRequest.mock.calls[0].length).toBe(1);
          const { body } = spyOnRequest.mock.calls[0][0];
          expect(body).toBe(expectedQuery);
        });
      });

      describe('given a query term with SQL injection using doubled apostrophes', () => {
        const authorizationStrategy = 'OWNERSHIP_BASED';
        let queryResult: QueryResult;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';
        let spyOnRequest: jest.SpyInstance<
          TransportRequestCallback,
          [
            params: TransportRequestParams,
            options?: TransportRequestOptions | undefined,
            callback?: ((err: ApiError, result: ApiResponse<Record<string, any>, unknown>) => void) | undefined,
          ]
        >;
        // Explanation: in addition to attack in the above test, now doubled the apostrophes to try to get around the
        // backslash escaping.
        const birthCity = `a'' or studentUniqueId is not null #`;
        const expectedQuery = `{"query":"SELECT info FROM ed-fi$3-3-1-b$student WHERE birthCity = 'a\\\\'\\\\' or studentUniqueId is not null #' AND createdBy = 'hi' ORDER BY _doc"}`;

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo]);
          const request = setupQueryRequest(authorizationStrategy, { birthCity }, {});

          spyOnRequest = jest.spyOn(client.transport, 'request');

          queryResult = await queryDocuments(request, client);
        });

        it('should return two students', async () => {
          expect(queryResult.documents.length).toBe(2);
        });

        it('should return the first student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdOne)).toBeGreaterThan(-1);
        });

        it('should return the second student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdTwo)).toBeGreaterThan(-1);
        });

        it('should have used the correct SQL query', async () => {
          expect(spyOnRequest.mock.calls.length).toBe(1);
          expect(spyOnRequest.mock.calls[0].length).toBe(1);
          const { body } = spyOnRequest.mock.calls[0][0];
          expect(body).toBe(expectedQuery);
        });
      });

      describe('given a query term with SQL injection using an escaped apostrophe', () => {
        const authorizationStrategy = 'OWNERSHIP_BASED';
        let queryResult: QueryResult;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';
        let spyOnRequest: jest.SpyInstance<
          TransportRequestCallback,
          [
            params: TransportRequestParams,
            options?: TransportRequestOptions | undefined,
            callback?: ((err: ApiError, result: ApiResponse<Record<string, any>, unknown>) => void) | undefined,
          ]
        >;
        // Explanation: try to avoid the escaping of ' by injecting a slash, so that the instead of "a\'" we generate a query
        // containing "a\\'". In that case, the final apostrophe is a real apostrophe, not an escaped one.
        const birthCity = `a\\' or studentUniqueId is not null #`;
        const expectedQuery = `{"query":"SELECT info FROM ed-fi$3-3-1-b$student WHERE birthCity = '' AND createdBy = 'hi' ORDER BY _doc"}`;

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo]);
          const request = setupQueryRequest(authorizationStrategy, { birthCity }, {});

          spyOnRequest = jest.spyOn(client.transport, 'request');

          queryResult = await queryDocuments(request, client);
        });

        it('should return two students', async () => {
          expect(queryResult.documents.length).toBe(2);
        });

        it('should return the first student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdOne)).toBeGreaterThan(-1);
        });

        it('should return the second student', async () => {
          expect(queryResult.documents.findIndex((x: any) => x.studentUniqueId === studentUniqueIdTwo)).toBeGreaterThan(-1);
        });

        it('should have used the correct SQL query', async () => {
          expect(spyOnRequest.mock.calls.length).toBe(1);
          expect(spyOnRequest.mock.calls[0].length).toBe(1);
          const { body } = spyOnRequest.mock.calls[0][0];
          expect(body).toBe(expectedQuery);
        });
      });
    });
  });
});
