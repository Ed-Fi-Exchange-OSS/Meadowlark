// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { getQueryHandler } from '../plugin/PluginLoader';
import { writeDebugStatusToLog } from '../Logger';
import { PaginationParameters } from '../message/PaginationParameters';
import { QueryRequest } from '../message/QueryRequest';
import { afterQueryDocuments, beforeQueryDocuments } from '../plugin/listener/Publish';
import { QueryResult } from '../message/QueryResult';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

const moduleName = 'core.handler.Query';
const TOTAL_COUNT_HEADER_NAME: string = 'total-count';

const removeDisallowedQueryParameters = R.omit(['offset', 'limit', 'totalCount']);
const onlyPaginationParameters = R.pick(['offset', 'limit']);

/**
 * Handler for API query requests
 *
 * Forwards query request to datastore backend
 */
export async function query(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  writeDebugStatusToLog(
    moduleName,
    frontendRequest,
    'query',
    undefined,
    `query string: ${JSON.stringify(frontendRequest.queryParameters)}`,
  );

  const cleanQueryParameters: object = removeDisallowedQueryParameters(frontendRequest.queryParameters);
  const paginationParameters: PaginationParameters = onlyPaginationParameters(frontendRequest.queryParameters);
  writeDebugStatusToLog(
    moduleName,
    frontendRequest,
    'query',
    undefined,
    `cleansed query string: ${JSON.stringify(cleanQueryParameters)}`,
  );

  const request: QueryRequest = {
    resourceInfo: frontendRequest.middleware.resourceInfo,
    queryParameters: cleanQueryParameters,
    paginationParameters,
    traceId: frontendRequest.traceId,
    security: frontendRequest.middleware.security,
  };

  await beforeQueryDocuments(request);
  const result: QueryResult = await getQueryHandler().queryDocuments(request);
  await afterQueryDocuments(request, result);

  const { response, documents } = result;

  if (response === 'QUERY_FAILURE_AUTHORIZATION') {
    writeDebugStatusToLog(moduleName, frontendRequest, 'query', 400);
    return { body: documents, statusCode: 400, headers: frontendRequest.middleware.headerMetadata };
  }

  if (response === 'UNKNOWN_FAILURE') {
    writeDebugStatusToLog(moduleName, frontendRequest, 'query', 500);
    return { statusCode: 500, headers: frontendRequest.middleware.headerMetadata };
  }

  if (response === 'QUERY_FAILURE_INVALID_QUERY') {
    const invalidQueryHeaders = {
      ...frontendRequest.middleware.headerMetadata,
      [TOTAL_COUNT_HEADER_NAME]: result.totalCount?.toString() ?? '0',
    };
    writeDebugStatusToLog(moduleName, frontendRequest, 'query', 500);
    return {
      statusCode: 500,
      headers: invalidQueryHeaders,
    };
  }

  if (response === 'QUERY_FAILURE_CONNECTION_ERROR') {
    const invalidQueryHeaders = {
      ...frontendRequest.middleware.headerMetadata,
      [TOTAL_COUNT_HEADER_NAME]: result.totalCount?.toString() ?? '0',
    };
    writeDebugStatusToLog(moduleName, frontendRequest, 'query', 502);
    return {
      statusCode: 502,
      headers: invalidQueryHeaders,
    };
  }

  if (response === 'QUERY_FAILURE_INDEX_NOT_FOUND') {
    const invalidQueryHeaders = {
      ...frontendRequest.middleware.headerMetadata,
      [TOTAL_COUNT_HEADER_NAME]: '0',
    };
    writeDebugStatusToLog(moduleName, frontendRequest, 'query', 200);
    return { statusCode: 200, headers: invalidQueryHeaders, body: documents };
  }

  writeDebugStatusToLog(moduleName, frontendRequest, 'query', 200);

  const headers = {
    ...frontendRequest.middleware.headerMetadata,
    [TOTAL_COUNT_HEADER_NAME]: result.totalCount?.toString() ?? '0',
  };

  return {
    body: documents,
    statusCode: 200,
    headers,
  };
}
