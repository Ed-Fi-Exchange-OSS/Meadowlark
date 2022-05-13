// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// eslint-disable-next-line import/no-unresolved
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import R from 'ramda';
import { getQueryHandler } from '../plugin/PluginLoader';
import { writeDebugStatusToLog } from '../Logger';
import { PathComponents } from '../model/PathComponents';
import { validateResource } from '../validation/RequestValidator';
import { PaginationParameters } from '../message/PaginationParameters';
import { QueryRequest } from '../message/QueryRequest';
import { afterQueryDocuments, beforeQueryDocuments } from '../plugin/listener/Publish';
import { QueryResult } from '../message/QueryResult';

const moduleName = 'Query';

const removeDisallowedQueryParameters = R.omit(['offset', 'limit', 'totalCount']);
const onlyPaginationParameters = R.pick(['offset', 'limit']);

/**
 * Handler for API query requests
 *
 * Validates resource and forwards query request to backend
 */
export async function query(
  pathComponents: PathComponents,
  queryStringParameters: object,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const { documentInfo, errorBody, headerMetadata } = await validateResource(pathComponents, null);
  if (errorBody !== null) {
    writeDebugStatusToLog(moduleName, context, 'query', 404, errorBody);
    return { body: errorBody, statusCode: 404, headers: headerMetadata };
  }

  const cleanQueryParameters: object = removeDisallowedQueryParameters(queryStringParameters);
  const paginationParameters: PaginationParameters = onlyPaginationParameters(queryStringParameters);

  const request: QueryRequest = {
    documentInfo,
    queryStringParameters: cleanQueryParameters,
    paginationParameters,
    traceId: context.awsRequestId,
  };

  beforeQueryDocuments(request);
  const result: QueryResult = await getQueryHandler().queryDocuments(request);
  afterQueryDocuments(request, result);

  const { response, documents } = result;

  if (response === 'QUERY_FAILURE_AUTHORIZATION') {
    writeDebugStatusToLog(moduleName, context, 'query', 400);

    return { body: JSON.stringify(documents), statusCode: 400, headers: headerMetadata };
  }

  if (response === 'UNKNOWN_FAILURE') {
    writeDebugStatusToLog(moduleName, context, 'query', 500);
    return { body: '', statusCode: 500, headers: headerMetadata };
  }

  writeDebugStatusToLog(moduleName, context, 'query', 200);
  const body = JSON.stringify(documents);
  return {
    body,
    statusCode: 200,
    headers: headerMetadata,
  };
}
