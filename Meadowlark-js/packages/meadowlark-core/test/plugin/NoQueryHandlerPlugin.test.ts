// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { NoQueryHandlerPlugin } from '../../src/plugin/backend/NoQueryHandlerPlugin';
import { newResourceInfo } from '../../src/model/ResourceInfo';
import { AuthorizationStrategy } from '../../src/security/AuthorizationStrategy';
import { PaginationParameters } from '../../src/message/PaginationParameters';
import { QueryRequest } from '../../src/message/QueryRequest';
import { QueryResult } from '../../src/message/QueryResult';
import { TraceId } from '../../src/model/IdTypes';

const setupQueryRequest = (
  authorizationStrategy: AuthorizationStrategy,
  queryParameters: any,
  paginationParameters: PaginationParameters,
  clientId = '',
): QueryRequest => ({
  resourceInfo: newResourceInfo(),
  queryParameters,
  paginationParameters,
  security: { authorizationStrategy, clientId },
  traceId: 'tracer' as TraceId,
});

describe('given query and no backend plugin has been configured', () => {
  const authorizationStrategy: AuthorizationStrategy = { type: 'UNDEFINED' };
  let queryResult: QueryResult;

  beforeAll(async () => {
    const request = setupQueryRequest(authorizationStrategy, {}, {});

    queryResult = await NoQueryHandlerPlugin.queryDocuments(request);
  });
  it('should return failure', async () => {
    // Assert
    expect(queryResult).toMatchInlineSnapshot(`
      {
        "documents": [],
        "response": "UNKNOWN_FAILURE",
      }
    `);
  });
});
