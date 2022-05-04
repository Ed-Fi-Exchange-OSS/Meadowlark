// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// eslint-disable-next-line import/no-unresolved
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import R from 'ramda';
import { getBackendPlugin } from '../plugin/PluginLoader';
import { writeDebugStatusToLog } from '../helpers/Logger';
import { PathComponents } from '../model/PathComponents';
import { validateResource } from '../validation/RequestValidator';
import { PaginationParameters } from '../plugin/backend/PaginationParameters';

const moduleName = 'Query';

const removeDisallowedQueryParameters = R.omit(['offset', 'limit', 'totalCount']);
const onlyPaginationParameters = R.pick(['offset', 'limit']);

/**
 * Handler for API GET requests that represent queries
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

  const { success, results } = await getBackendPlugin().queryDocumentList(
    documentInfo,
    cleanQueryParameters,
    paginationParameters,
    context.awsRequestId,
  );

  if (!success) {
    if (results?.length > 0) {
      return { body: JSON.stringify(results), statusCode: 400, headers: headerMetadata };
    }
    writeDebugStatusToLog(moduleName, context, 'query', 500);
    return { body: '', statusCode: 500, headers: headerMetadata };
  }

  writeDebugStatusToLog(moduleName, context, 'query', 200);
  const body = JSON.stringify(results);
  return {
    body,
    statusCode: 200,
    headers: headerMetadata,
  };
}
