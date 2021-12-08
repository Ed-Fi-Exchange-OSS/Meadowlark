// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* NB: these are "private" functions for use by CrudHandler, exported for testability - both in directly testing the
 * functions, and in replacing them with mocks when testing CrudHandler. */

// eslint-disable-next-line import/no-unresolved
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { int } from 'aws-sdk/clients/datapipeline';

import { Logger } from '../helpers/Logger';
import { PathComponents } from '../model/PathComponents';
import { Security } from '../model/Security';
import { getEntityById, getEntityList } from '../repository/DynamoEntityRepository';
import { queryEntityList } from '../repository/ElasticsearchRepository';
import { validateResource } from './RequestValidator';

function writeDebugStatusToLog(context: Context, method: string, status: int, message: string = ''): void {
  Logger.debug(`Get.${method} ${status} ${message || ''}`.trimEnd(), context.awsRequestId);
}

/**
 * Handler for API GET requests that represent "get all"
 *
 * Validates resource and forwards "get all" request to DynamoRepository
 */
export async function list(pathComponents: PathComponents, context: Context): Promise<APIGatewayProxyResult> {
  const { entityInfo, errorBody, metaEdProjectHeaders } = await validateResource(pathComponents, null);
  if (errorBody !== null) {
    writeDebugStatusToLog(context, 'list', 404, errorBody);
    return { body: errorBody, statusCode: 404, headers: metaEdProjectHeaders };
  }

  const { result, documents } = await getEntityList(entityInfo, context.awsRequestId);

  if (result === 'ERROR') {
    writeDebugStatusToLog(context, 'list', 500);
    return { body: JSON.stringify({ message: 'Failure' }), statusCode: 500, headers: metaEdProjectHeaders };
  }

  writeDebugStatusToLog(context, 'list', 200);
  return {
    body: JSON.stringify(documents),
    statusCode: 200,
    headers: metaEdProjectHeaders,
  };
}

/**
 * Handler for API GET requests that represent "get by id"
 *
 * Validates resource and forwards "get by id" request to DynamoRepository
 */
export async function getById(
  pathComponents: PathComponents,
  context: Context,
  security: Security,
): Promise<APIGatewayProxyResult> {
  if (pathComponents.resourceId == null) {
    writeDebugStatusToLog(context, 'get', 404);
    return { body: '', statusCode: 404 };
  }

  const { entityInfo, errorBody, metaEdProjectHeaders } = await validateResource(pathComponents, null);
  if (errorBody !== null) {
    writeDebugStatusToLog(context, 'get', 404, errorBody);
    return { body: errorBody, statusCode: 404, headers: metaEdProjectHeaders };
  }

  const { result, documents, securityResolved } = await getEntityById(
    entityInfo,
    pathComponents.resourceId,
    security,
    context.awsRequestId,
  );

  if (result === 'ERROR') {
    writeDebugStatusToLog(context, 'get', 500);
    return { body: '', statusCode: 500, headers: metaEdProjectHeaders };
  }

  if (documents.length < 1) {
    writeDebugStatusToLog(context, 'get', 404);
    return {
      body: '',
      statusCode: 404,
      headers: { ...metaEdProjectHeaders, 'x-security-resolved': securityResolved?.join(',') },
    };
  }

  writeDebugStatusToLog(context, 'get', 200);
  return {
    body: JSON.stringify(documents[0]),
    statusCode: 200,
    headers: { ...metaEdProjectHeaders, 'x-security-resolved': securityResolved?.join(',') },
  };
}

/**
 * Handler for API GET requests that represent queries
 *
 * Validates resource and forwards query request to ElasticsearchRepository
 */
export async function query(
  pathComponents: PathComponents,
  queryStringParameters: object,
  context: Context,
  security: Security,
): Promise<APIGatewayProxyResult> {
  const { entityInfo, errorBody, metaEdProjectHeaders } = await validateResource(pathComponents, null);
  if (errorBody !== null) {
    writeDebugStatusToLog(context, 'query', 404, errorBody);
    return { body: errorBody, statusCode: 404, headers: metaEdProjectHeaders };
  }

  const { success, results } = await queryEntityList(
    entityInfo,
    queryStringParameters ?? {},
    security,
    context.awsRequestId,
  );

  if (!success) {
    if (results?.length > 0) {
      return { body: JSON.stringify(results), statusCode: 400, headers: metaEdProjectHeaders };
    }
    writeDebugStatusToLog(context, 'query', 500);
    return { body: '', statusCode: 500, headers: metaEdProjectHeaders };
  }

  writeDebugStatusToLog(context, 'query', 200);
  const body = JSON.stringify(results);
  return {
    body,
    statusCode: 200,
    headers: metaEdProjectHeaders,
  };
}
