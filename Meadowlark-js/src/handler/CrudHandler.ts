// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { validateResource } from './RequestValidator';
import {
  createEntity,
  updateEntityById,
  deleteEntityById,
  getReferencesToThisItem,
  getForeignKeyReferences,
  deleteItems,
  validateEntityOwnership,
} from '../repository/MongoEntityRepository';

import { Logger } from '../helpers/Logger';
import { PathComponents } from '../model/PathComponents';
import { getById, query } from './GetResolvers';
import { isDocumentIdValid, documentIdForEntityInfo } from '../helpers/DocumentId';
import { NoEntityInfo } from '../model/EntityInfo';
import { validateJwt } from '../helpers/JwtValidator';
import { newSecurity } from '../model/Security';
import { authorizationHeader } from '../helpers/AuthorizationHeader';

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

    const { entityInfo, errorBody, metaEdProjectHeaders } = await validateResource(pathComponents, body);
    if (errorBody != null) {
      const statusCode = entityInfo === NoEntityInfo ? 404 : 400;
      writeDebugStatusToLog(context, 'create', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: metaEdProjectHeaders };
    }

    const resourceId = documentIdForEntityInfo(entityInfo);
    const { result, failureMessage } = await createEntity(
      resourceId,
      entityInfo,
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
      return {
        body: '',
        statusCode: 201,
        headers: { ...metaEdProjectHeaders, Location: `${event.path}${event.path.endsWith('/') ? '' : '/'}${resourceId}` },
      };
    }
    if (result === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(context, 'create', 200);
      return {
        body: '',
        statusCode: 200,
        headers: { ...metaEdProjectHeaders, Location: `${event.path}${event.path.endsWith('/') ? '' : '/'}${resourceId}` },
      };
    }
    if (result === 'UPDATE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(context, 'create', 409);
      return {
        body: '',
        statusCode: 409,
        headers: metaEdProjectHeaders,
      };
    }
    if (result === 'UPDATE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(context, 'create', 404);
      return {
        body: '',
        statusCode: 404,
        headers: metaEdProjectHeaders,
      };
    }
    if (result === 'INSERT_FAILURE_REFERENCE' || result === 'INSERT_FAILURE_ASSIGNABLE_COLLISION') {
      writeDebugStatusToLog(context, 'create', 400, failureMessage);
      return {
        body: JSON.stringify({ message: failureMessage }),
        statusCode: 400,
        headers: metaEdProjectHeaders,
      };
    }

    writeErrorToLog(context, event, 'create', 500, failureMessage);
    return { body: '', statusCode: 500, headers: metaEdProjectHeaders };
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

    const { entityInfo, errorBody, metaEdProjectHeaders } = await validateResource(pathComponents, body);
    if (errorBody !== null) {
      const statusCode = entityInfo === NoEntityInfo ? 404 : 400;
      writeDebugStatusToLog(context, 'update', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: metaEdProjectHeaders };
    }

    const resourceIdFromBody = documentIdForEntityInfo(entityInfo);
    if (resourceIdFromBody !== pathComponents.resourceId) {
      const failureMessage = 'The natural key of the resource does not match the natural key in the updated document.';
      writeDebugStatusToLog(context, 'update', 400, failureMessage);
      return {
        body: JSON.stringify({ message: failureMessage }),
        statusCode: 400,
        headers: metaEdProjectHeaders,
      };
    }

    const { result, failureMessage } = await updateEntityById(
      pathComponents.resourceId,
      entityInfo,
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
      return {
        body: '',
        statusCode: 204,
        headers: metaEdProjectHeaders,
      };
    }
    if (result === 'UPDATE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(context, 'update', 404);
      return {
        body: '',
        statusCode: 404,
        headers: metaEdProjectHeaders,
      };
    }
    if (result === 'UPDATE_FAILURE_REFERENCE') {
      writeDebugStatusToLog(context, 'update', 400, failureMessage);
      return {
        body: JSON.stringify({ message: failureMessage }),
        statusCode: 400,
        headers: metaEdProjectHeaders,
      };
    }
    writeDebugStatusToLog(context, 'update', 500, failureMessage);
    return {
      body: JSON.stringify({ message: failureMessage ?? 'Failure' }),
      statusCode: 500,
      headers: metaEdProjectHeaders,
    };
  } catch (e) {
    writeErrorToLog(context, event, 'update', 500, e);
    return { body: '', statusCode: 500 };
  }
}

/**
 * Entry point for all API DELETE requests, which are "by id"
 *
 * Validates resource and forwards to DynamoRepository for deletion
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

    const { entityInfo, errorBody, metaEdProjectHeaders } = await validateResource(pathComponents, null);
    if (errorBody !== null) {
      const statusCode = entityInfo === NoEntityInfo ? 404 : 400;
      writeDebugStatusToLog(context, 'deleteIt', statusCode, errorBody);
      return { body: errorBody, statusCode, headers: metaEdProjectHeaders };
    }

    if (jwtStatus.isOwnershipEnabled) {
      const { isOwner, result: ownershipResult } = await validateEntityOwnership(
        pathComponents.resourceId,
        entityInfo,
        jwtStatus.subject,
        awsRequestId,
      );

      if (ownershipResult === 'ERROR') {
        writeDebugStatusToLog(context, 'deleteIt', 500);
        return { body: '', statusCode: 500, headers: metaEdProjectHeaders };
      }

      if (ownershipResult === 'NOT_FOUND') {
        writeDebugStatusToLog(context, 'deleteIt', 404);
        return { body: '', statusCode: 404, headers: metaEdProjectHeaders };
      }

      if (!isOwner) {
        writeDebugStatusToLog(context, 'deleteIt ownership not valid', 404);
        return { body: '', statusCode: 404, headers: metaEdProjectHeaders };
      }
    }

    const foreignKeysLookup = await getReferencesToThisItem(pathComponents.resourceId, entityInfo, awsRequestId);
    if (!foreignKeysLookup.success || foreignKeysLookup.foreignKeys?.length > 0) {
      const fks = foreignKeysLookup.foreignKeys.map((fk) => fk.Description);
      const body = JSON.stringify({
        error: 'Unable to delete this item because there are foreign keys pointing to it',
        foreignKeys: fks,
      });

      writeDebugStatusToLog(context, 'deleteIt foreign keys exist', 409);
      return { body, statusCode: 409, headers: metaEdProjectHeaders };
    }

    const { success } = await deleteEntityById(pathComponents.resourceId, entityInfo, awsRequestId);

    if (!success) {
      writeDebugStatusToLog(context, 'deleteIt', 500);
      return { body: '', statusCode: 500, headers: metaEdProjectHeaders };
    }

    // Now that the main object has been deleted, we need to delete the foreign key references
    Logger.debug(
      `CrudHandler.deleteIt deleting this item's foreign key references`,
      context.awsRequestId,
      null,
      foreignKeysLookup.foreignKeys,
    );
    const { success: fkSuccess, foreignKeys } = await getForeignKeyReferences(
      pathComponents.resourceId,
      entityInfo,
      awsRequestId,
    );

    if (fkSuccess) {
      // Delete the (FREF, TREF) records
      await deleteItems(
        foreignKeys.map((i) => ({ pk: i.From, sk: i.To })),
        awsRequestId,
      );
      // And now reverse that, to delete the (TREF, FREF) records
      await deleteItems(
        foreignKeys.map((i) => ({ pk: i.To, sk: i.From })),
        awsRequestId,
      );
    } // Else: user can't resolve this error, and it should be logged already. Ignore.

    // Currently we are returning 204 even if there was no record to delete, IF the resourceId looks like a real resourced
    // id. Should we? Interestingly, a completely bogus resource Id like "i+am+not+an+id" gives a 404.
    writeDebugStatusToLog(context, 'deleteIt', 204);
    return {
      body: '',
      statusCode: 204,
      headers: metaEdProjectHeaders,
    };
  } catch (e) {
    writeErrorToLog(context, event, 'deleteIt', 500, e);
    return { body: '', statusCode: 500 };
  }
}
