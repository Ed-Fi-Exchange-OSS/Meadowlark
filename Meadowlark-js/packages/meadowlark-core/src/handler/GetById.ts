// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// eslint-disable-next-line import/no-unresolved
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { getDocumentStore } from '../plugin/PluginLoader';
import { writeDebugStatusToLog } from '../Logger';
import { PathComponents } from '../model/PathComponents';
import { Security } from '../model/Security';
import { validateResource } from '../validation/RequestValidator';
import { GetRequest } from '../message/GetRequest';
import { afterGetDocumentById, beforeGetDocumentById } from '../plugin/listener/Publish';
import { GetResult } from '../message/GetResult';

const moduleName = 'GetById';

/**
 * Handler for API "get by id" requests
 *
 * Validates resource and forwards "get by id" request to backend
 */
export async function getById(
  pathComponents: PathComponents,
  context: Context,
  security: Security,
): Promise<APIGatewayProxyResult> {
  if (pathComponents.resourceId == null) {
    writeDebugStatusToLog(moduleName, context, 'getById', 404);
    return { body: '', statusCode: 404 };
  }

  const { documentInfo, errorBody, headerMetadata } = await validateResource(pathComponents, null);
  if (errorBody !== null) {
    writeDebugStatusToLog(moduleName, context, 'getById', 404, errorBody);
    return { body: errorBody, statusCode: 404, headers: headerMetadata };
  }

  const request: GetRequest = {
    id: pathComponents.resourceId,
    documentInfo,
    security,
    traceId: context.awsRequestId,
  };

  beforeGetDocumentById(request);
  const result: GetResult = await getDocumentStore().getDocumentById(request);
  afterGetDocumentById(request, result);

  const { response, document, securityResolved } = result;

  if (response === 'UNKNOWN_FAILURE') {
    writeDebugStatusToLog(moduleName, context, 'getById', 500);
    return { body: '', statusCode: 500, headers: headerMetadata };
  }

  if (response === 'GET_FAILURE_NOT_EXISTS') {
    writeDebugStatusToLog(moduleName, context, 'getById', 404);
    return {
      body: '',
      statusCode: 404,
      headers: { ...headerMetadata, 'x-security-resolved': securityResolved?.join(',') },
    };
  }

  writeDebugStatusToLog(moduleName, context, 'getById', 200);
  return {
    body: JSON.stringify(document),
    statusCode: 200,
    headers: { ...headerMetadata, 'x-security-resolved': securityResolved?.join(',') },
  };
}
