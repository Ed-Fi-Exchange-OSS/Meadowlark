// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { validateResource } from '../validation/RequestValidator';
import { Logger } from '../helpers/Logger';
import { PathComponents } from '../model/PathComponents';
import { getById, query } from './GetResolvers';
import { isDocumentIdValid, documentIdForEntityInfo } from '../helpers/DocumentId';
import { NoEntityInfo } from '../model/DocumentInfo';
import { validateJwt } from '../helpers/JwtValidator';
import { newSecurity } from '../model/Security';
import { authorizationHeader } from '../helpers/AuthorizationHeader';
import { getBackendPlugin } from '../plugin/PluginLoader';

function getPathComponents(path: string): PathComponents | null {
  // Matches all of the following sample expressions:
  // /v3.3b/ed-fi/Sections
  // /v3.3b/ed-fi/Sections/
  // /v3.3b/ed-fi/Sections/idValue
  const pathExpression = /\/(?<version>[^/]+)\/(?<namespace>[^/]+)\/(?<resource>[^/]+)(\/|$)((?<resourceId>[^/]*$))?/gm;
  const match = pathExpression.exec(path);

  if (match?.groups == null) {
    return null;
  }

  // Confirm that the id value is a properly formed document id
  const { resourceId } = match.groups ?? null;
  if (resourceId != null && !isDocumentIdValid(resourceId)) {
    return null;
  }
  return {
    version: match.groups.version,
    namespace: match.groups.namespace,
    endpointName: match.groups.resource,
    resourceId,
  };
}

function writeRequestToLog(event: APIGatewayProxyEvent, context: Context, method: string): void {
  Logger.info(`CrudHandler.${method} ${event.path}`, context.awsRequestId, event.requestContext.requestId, event.headers);
}

function writeDebugStatusToLog(context: Context, method: string, status: number, message: string = ''): void {
  Logger.debug(`CrudHandler.${method} ${status} ${message || ''}`.trimEnd(), context.awsRequestId);
}

function writeErrorToLog(context: Context, event: APIGatewayProxyEvent, method: string, status: number, error?: any): void {
  Logger.error(`CrudHandler.${method} ${status}`, context.awsRequestId, event.requestContext.requestId, error);
}

/**
 * Entry point for API POST requests
 *
 * Validates resource and JSON document shape, extracts keys and forwards to DynamoRepository for creation
 */
export async function create(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    writeRequestToLog(event, context, 'create');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(event));
    if (errorResponse != null) {
      writeDebugStatusToLog(context, 'create', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as APIGatewayProxyResult;
    }

    const pathComponents = getPathComponents(event.path);

    if (pathComponents === null) {
      writeDebugStatusToLog(context, 'create', 404);
      return { body: '', statusCode: 404 };
    }

    if (event.body == null) {
      const message = 'Missing body';
      writeDebugStatusToLog(context, 'create', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    let body: object = {};
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      const message = 'Malformed body';
      writeDebugStatusToLog(context, 'create', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    const { documentInfo, errorBody, headerMetadata } = await validateResource(pathComponents, body);
    if (errorBody != null) {
      const statusCode = documentInfo === NoEntityInfo ? 404 : 400;
      writeDebugStatusToLog(context, 'create', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: headerMetadata };
    }

    const resourceId = documentIdForEntityInfo(documentInfo);
    const { result, failureMessage } = await getBackendPlugin().createEntity(
      resourceId,
      documentInfo,
      body,
      {
        referenceValidation: event.headers['reference-validation'] !== 'false',
        descriptorValidation: event.headers['descriptor-validation'] !== 'false',
      },
      {
        ...newSecurity(),
        isOwnershipEnabled: jwtStatus.isOwnershipEnabled,
        clientName: jwtStatus.subject,
      },
      context.awsRequestId,
    );
    if (result === 'INSERT_SUCCESS') {
      writeDebugStatusToLog(context, 'create', 201);
      const location = `${event.path}${event.path.endsWith('/') ? '' : '/'}${resourceId}`;
      return {
        body: '',
        statusCode: 201,
        headers: { ...headerMetadata, Location: location },
      };
    }
    if (result === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(context, 'create', 200);
      const location = `${event.path}${event.path.endsWith('/') ? '' : '/'}${resourceId}`;
      return { body: '', statusCode: 200, headers: { ...headerMetadata, Location: location } };
    }
    if (result === 'UPDATE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(context, 'create', 409);
      return { body: '', statusCode: 409, headers: headerMetadata };
    }
    if (result === 'UPDATE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(context, 'create', 404);
      return { body: '', statusCode: 404, headers: headerMetadata };
    }
    if (result === 'INSERT_FAILURE_REFERENCE' || result === 'INSERT_FAILURE_ASSIGNABLE_COLLISION') {
      writeDebugStatusToLog(context, 'create', 400, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 400, headers: headerMetadata };
    }

    writeErrorToLog(context, event, 'create', 500, failureMessage);
    return { body: '', statusCode: 500, headers: headerMetadata };
  } catch (e) {
    writeErrorToLog(context, event, 'create', 500, e);
    return { body: '', statusCode: 500 };
  }
}

/**
 * Entry point for all API GET requests
 *
 * Determines whether request is "get all", "get by id", or a query, and forwards to the appropriate handler
 */
export async function getResolver(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    writeRequestToLog(event, context, 'getResolver');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(event));
    if (errorResponse != null) {
      writeDebugStatusToLog(context, 'create', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as APIGatewayProxyResult;
    }

    const pathComponents = getPathComponents(event.path);
    if (pathComponents === null) {
      writeDebugStatusToLog(context, 'getResolver', 404);
      return { body: '', statusCode: 404 };
    }

    let edOrgIds: string[] = [];
    if (event.headers['x-security-edorgid'] != null) edOrgIds = (event.headers['x-security-edorgid'] as string).split(',');

    let studentIds: string[] = [];
    if (event.headers['x-security-studentid'] != null)
      studentIds = (event.headers['x-security-studentid'] as string).split(',');

    const throughAssociation = event.headers['x-security-through'];
    if (pathComponents.resourceId != null)
      return await getById(pathComponents, context, {
        edOrgIds,
        studentIds,
        throughAssociation,
        isOwnershipEnabled: jwtStatus.isOwnershipEnabled,
        clientName: jwtStatus.subject,
      });

    return await query(pathComponents, event.queryStringParameters ?? {}, context);
  } catch (e) {
    writeErrorToLog(context, event, 'getResolver', 500, e);
    return { body: '', statusCode: 500 };
  }
}

/**
 * Entry point for all API PUT requests, which are "by id"
 *
 * Validates resource and JSON document shape, extracts keys and forwards to DynamoRepository for update
 */
export async function update(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    writeRequestToLog(event, context, 'update');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(event));
    if (errorResponse != null) {
      writeDebugStatusToLog(context, 'update', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as APIGatewayProxyResult;
    }

    const pathComponents = getPathComponents(event.path);
    if (pathComponents === null || pathComponents.resourceId == null) {
      writeDebugStatusToLog(context, 'update', 404);
      return { body: '', statusCode: 404 };
    }

    if (event.body == null) {
      const message = 'Missing body';
      writeDebugStatusToLog(context, 'update', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    let body: any = {};
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      const message = 'Malformed body';
      writeDebugStatusToLog(context, 'update', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    const { documentInfo, errorBody, headerMetadata } = await validateResource(pathComponents, body);
    if (errorBody !== null) {
      const statusCode = documentInfo === NoEntityInfo ? 404 : 400;
      writeDebugStatusToLog(context, 'update', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: headerMetadata };
    }

    const resourceIdFromBody = documentIdForEntityInfo(documentInfo);
    if (resourceIdFromBody !== pathComponents.resourceId) {
      const failureMessage = 'The identity of the resource does not match the identity in the updated document.';
      writeDebugStatusToLog(context, 'update', 400, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 400, headers: headerMetadata };
    }

    const { result, failureMessage } = await getBackendPlugin().updateEntityById(
      pathComponents.resourceId,
      documentInfo,
      body,
      {
        referenceValidation: event.headers['reference-validation'] !== 'false',
        descriptorValidation: event.headers['descriptor-validation'] !== 'false',
      },
      {
        ...newSecurity(),
        isOwnershipEnabled: jwtStatus.isOwnershipEnabled,
        clientName: jwtStatus.subject,
      },
      context.awsRequestId,
    );
    if (result === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(context, 'update', 204);
      return { body: '', statusCode: 204, headers: headerMetadata };
    }
    if (result === 'UPDATE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(context, 'update', 404);
      return { body: '', statusCode: 404, headers: headerMetadata };
    }
    if (result === 'UPDATE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(context, 'update', 400, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 400, headers: headerMetadata };
    }
    writeDebugStatusToLog(context, 'update', 500, failureMessage);
    return { body: JSON.stringify({ message: failureMessage ?? 'Failure' }), statusCode: 500, headers: headerMetadata };
  } catch (e) {
    writeErrorToLog(context, event, 'update', 500, e);
    return { body: '', statusCode: 500 };
  }
}

/**
 * Entry point for all API DELETE requests, which are "by id"
 *
 * Validates resource and forwards to backend for deletion
 */
export async function deleteIt(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const { awsRequestId } = context;
  try {
    writeRequestToLog(event, context, 'deleteIt');

    const { jwtStatus, errorResponse } = validateJwt(authorizationHeader(event));
    if (errorResponse != null) {
      writeDebugStatusToLog(context, 'deleteIt', errorResponse.statusCode, JSON.stringify(jwtStatus));
      return errorResponse as APIGatewayProxyResult;
    }

    const pathComponents = getPathComponents(event.path);
    if (pathComponents === null || pathComponents.resourceId == null) {
      writeDebugStatusToLog(context, 'deleteIt', 404);
      return { body: '', statusCode: 404 };
    }

    const { documentInfo, errorBody, headerMetadata } = await validateResource(pathComponents, null);
    if (errorBody !== null) {
      const statusCode = documentInfo === NoEntityInfo ? 404 : 400;
      writeDebugStatusToLog(context, 'deleteIt', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: headerMetadata };
    }

    const { result, failureMessage } = await getBackendPlugin().deleteEntityById(
      pathComponents.resourceId,
      documentInfo,
      {
        referenceValidation: event.headers['reference-validation'] !== 'false',
        descriptorValidation: event.headers['descriptor-validation'] !== 'false',
      },
      {
        ...newSecurity(),
        isOwnershipEnabled: jwtStatus.isOwnershipEnabled,
        clientName: jwtStatus.subject,
      },
      awsRequestId,
    );

    if (result === 'DELETE_SUCCESS') {
      writeDebugStatusToLog(context, 'deleteIt', 204);
      return { body: '', statusCode: 204, headers: headerMetadata };
    }
    if (result === 'DELETE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(context, 'deleteIt', 404);
      return { body: '', statusCode: 404, headers: headerMetadata };
    }
    if (result === 'DELETE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(context, 'deleteIt', 409, failureMessage);
      return { body: JSON.stringify({ message: failureMessage }), statusCode: 409, headers: headerMetadata };
    }
    writeDebugStatusToLog(context, 'deleteIt', 500, failureMessage);
    return { body: JSON.stringify({ message: failureMessage ?? 'Failure' }), statusCode: 500, headers: headerMetadata };
  } catch (e) {
    writeErrorToLog(context, event, 'deleteIt', 500, e);
    return { body: '', statusCode: 500 };
  }
}
