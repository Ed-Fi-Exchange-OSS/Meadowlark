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

const moduleName = 'Query';

const removeDisallowedQueryParameters = R.omit(['offset', 'limit', 'totalCount']);
const onlyPaginationParameters = R.pick(['offset', 'limit']);

/**
 * Handler for API query requests
 *
 * Forwards query request to datastore backend
 */
export async function query(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  const cleanQueryParameters: object = removeDisallowedQueryParameters(frontendRequest.queryStringParameters);
  const paginationParameters: PaginationParameters = onlyPaginationParameters(frontendRequest.queryStringParameters);

  const request: QueryRequest = {
    resourceInfo: frontendRequest.middleware.resourceInfo,
    queryStringParameters: cleanQueryParameters,
    paginationParameters,
    traceId: frontendRequest.traceId,
    security: frontendRequest.middleware.security,
  };

  beforeQueryDocuments(request);
  const result: QueryResult = await getQueryHandler().queryDocuments(request);
  afterQueryDocuments(request, result);

  const { response, documents } = result;

  if (response === 'QUERY_FAILURE_AUTHORIZATION') {
    writeDebugStatusToLog(moduleName, frontendRequest, 'query', 400);

    return { body: JSON.stringify(documents), statusCode: 400, headers: frontendRequest.middleware.headerMetadata };
  }

  if (response === 'UNKNOWN_FAILURE') {
    writeDebugStatusToLog(moduleName, frontendRequest, 'query', 500);
    return { body: '', statusCode: 500, headers: frontendRequest.middleware.headerMetadata };
  }

  writeDebugStatusToLog(moduleName, frontendRequest, 'query', 200);
  const body = JSON.stringify(documents);
  return {
    body,
    statusCode: 200,
    headers: frontendRequest.middleware.headerMetadata,
  };
}
