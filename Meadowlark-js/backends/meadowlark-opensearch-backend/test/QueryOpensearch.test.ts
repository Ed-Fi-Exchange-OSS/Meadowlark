// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Client, errors } from '@opensearch-project/opensearch';
import Mock from '@short.io/opensearch-mock';
import {
  PaginationParameters,
  QueryRequest,
  QueryResult,
  AuthorizationStrategy,
  TraceId,
  ResourceInfo,
} from '@edfi/meadowlark-core';
import { indexFromResourceInfo, queryDocuments } from '../src/repository/QueryOpensearch';

const mock = new Mock();

const resourceInfo: ResourceInfo = {
  projectName: 'ed-fi',
  resourceName: 'student',
  isDescriptor: false,
  resourceVersion: '3.3.1-b',
  allowIdentityUpdates: false,
};

describe('when querying for students', () => {
  const setupMockRequestHappyPath = (uniqueIds: string[], matches: any[], size?: number, from?: number): Client => {
    const datarows = uniqueIds.map((x) => ({ _source: { studentUniqueId: x, info: `{ "studentUniqueId": "${x}" }` } }));

    const body: any = {
      query: {
        bool: {
          must: matches,
        },
      },
      sort: [{ _doc: { order: 'asc' } }],
    };

    if (size) body.size = size;

    if (from) body.from = from;

    mock.add(
      {
        method: 'POST',
        path: `/${indexFromResourceInfo(resourceInfo)}/_search`,
        body,
      },
      () => ({
        hits: {
          total: { value: datarows.length, relation: 'eq' },
          hits: datarows,
        },
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
    queryParameters: any,
    paginationParameters: PaginationParameters,
    clientId = 'hi',
  ): QueryRequest => ({
    resourceInfo: {
      projectName: 'ed-fi',
      resourceName: 'student',
      isDescriptor: false,
      resourceVersion: '3.3.1-b',
      allowIdentityUpdates: false,
    },
    queryParameters,
    paginationParameters,
    security: { authorizationStrategy, clientId },
    traceId: 'tracer' as TraceId,
  });

  describe('given there are no students', () => {
    it('should return an empty array', async () => {
      // Arrange
      const client = setupMockRequestHappyPath([], []);
      const request = setupQueryRequest({ type: 'FULL_ACCESS' }, {}, {});

      // Act
      const result = await queryDocuments(request, client);

      // Assert
      expect(result.documents.length).toEqual(0);
    });

    afterAll(() => {
      mock.clearAll();
    });
  });

  describe('given there are students', () => {
    describe('given full access authorization', () => {
      describe('given no query or pagination', () => {
        const authorizationStrategy: AuthorizationStrategy = { type: 'FULL_ACCESS' };
        let queryResult: QueryResult;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo], []);
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

        afterAll(() => {
          mock.clearAll();
        });
      });

      describe('given two query terms', () => {
        const authorizationStrategy: AuthorizationStrategy = { type: 'FULL_ACCESS' };
        let queryResult: QueryResult;
        let spyOnRequest: jest.SpyInstance;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';
        const birthCity = 'a';
        const birthDate = '2022-07-28';
        const matches = [
          {
            match_phrase: { birthCity },
          },
          {
            match_phrase: { birthDate },
          },
        ];
        const expectedQuery = {
          query: {
            bool: {
              must: matches,
            },
          },
          sort: [{ _doc: { order: 'asc' } }],
        };

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo], matches);
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

        it('should have used the correct query', async () => {
          expect(spyOnRequest.mock.calls.length).toBe(1);
          expect(spyOnRequest.mock.calls[0].length).toBe(1);
          const { body } = spyOnRequest.mock.calls[0][0];
          expect(body).toEqual(JSON.stringify(expectedQuery));
        });

        afterAll(() => {
          mock.clearAll();
        });
      });

      describe('given page limits', () => {
        const authorizationStrategy: AuthorizationStrategy = { type: 'FULL_ACCESS' };
        let queryResult: QueryResult;
        let spyOnRequest: jest.SpyInstance;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';
        const limit = 1;
        const offset = 2;
        const expectedQuery = {
          from: 2,
          query: { bool: { must: [] } },
          size: 1,
          sort: [{ _doc: { order: 'asc' } }],
        };

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo], [], limit, offset);
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

        it('should have used the correct query', async () => {
          expect(spyOnRequest.mock.calls.length).toBe(1);
          expect(spyOnRequest.mock.calls[0].length).toBe(1);
          const { body } = spyOnRequest.mock.calls[0][0];
          expect(body).toEqual(JSON.stringify(expectedQuery));
        });

        afterAll(() => {
          mock.clearAll();
        });
      });

      describe('given both query terms and page limits', () => {
        const authorizationStrategy: AuthorizationStrategy = { type: 'FULL_ACCESS' };
        let queryResult: QueryResult;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';
        const birthCity = 'a';
        const birthDate = '2022-07-28';
        const matches = [
          {
            match_phrase: { birthCity },
          },
          {
            match_phrase: { birthDate },
          },
        ];
        let spyOnRequest: jest.SpyInstance;
        const limit = 1;
        const offset = 1;
        const expectedQuery = {
          from: offset,
          query: { bool: { must: matches } },
          size: limit,
          sort: [{ _doc: { order: 'asc' } }],
        };

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo], matches, limit, offset);
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

        it('should have used the correct query', async () => {
          expect(spyOnRequest.mock.calls.length).toBe(1);
          expect(spyOnRequest.mock.calls[0].length).toBe(1);
          const { body } = spyOnRequest.mock.calls[0][0];
          expect(body).toEqual(JSON.stringify(expectedQuery));
        });

        afterAll(() => {
          mock.clearAll();
        });
      });

      describe('when querying with a case different from the case in the datastore', () => {
        const authorizationStrategy: AuthorizationStrategy = { type: 'FULL_ACCESS' };
        let queryResult: QueryResult;
        const studentUniqueIdOne = 'one';
        const studentUniqueIdTwo = 'two';
        const birthCity = 'a';
        const matches = [
          {
            match_phrase: { birthCity: birthCity.toUpperCase() },
          },
        ];

        beforeAll(async () => {
          const client = setupMockRequestHappyPath([studentUniqueIdOne, studentUniqueIdTwo], matches);
          const request = setupQueryRequest(authorizationStrategy, { birthCity: birthCity.toUpperCase() }, {});

          queryResult = await queryDocuments(request, client);
        });

        it('should return the two students regardless of the casing', async () => {
          expect(queryResult.documents.length).toBe(2);
        });

        afterAll(() => {
          mock.clearAll();
        });
      });
    });
  });

  describe('given there is a connection error', () => {
    let queryResult: QueryResult;
    const setupMockRequestConnectionError = (): Client => {
      mock.add(
        {
          method: 'POST',
          path: `/${indexFromResourceInfo(resourceInfo)}/_search`,
        },
        () => new errors.ConnectionError('Connection error failure message'),
      );

      const client = new Client({
        node: 'http://localhost:9200',
        Connection: mock.getConnection(),
      });
      return client;
    };

    beforeAll(async () => {
      const client = setupMockRequestConnectionError();
      const request = setupQueryRequest({ type: 'FULL_ACCESS' }, {}, {});

      queryResult = await queryDocuments(request, client);
    });

    it('should return connection error', async () => {
      expect(queryResult.failureMessage).toBe('Connection error failure message');
      expect(queryResult.response).toBe('QUERY_FAILURE_CONNECTION_ERROR');
      expect(queryResult.documents.length).toBe(0);
    });

    afterAll(() => {
      mock.clearAll();
    });
  });
});
