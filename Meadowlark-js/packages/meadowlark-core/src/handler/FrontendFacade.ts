// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import R from 'ramda';
import { initializeLogging, writeErrorToLog } from '@edfi/meadowlark-utilities';
import { authorize } from '../middleware/AuthorizationMiddleware';
import { MiddlewareModel } from '../middleware/MiddlewareModel';
import { parsePath } from '../middleware/ParsePathMiddleware';
import { parseBody } from '../middleware/ParseBodyMiddleware';
import { resourceValidation } from '../middleware/ValidateResourceMiddleware';
import { resourceIdValidation } from '../middleware/ValidateResourceIdMiddleware';
import { documentValidation } from '../middleware/ValidateDocumentMiddleware';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';
import * as Upsert from './Upsert';
import * as Update from './Update';
import * as Delete from './Delete';
import * as Query from './Query';
import * as GetById from './GetById';
import { ensurePluginsLoaded, getDocumentStore } from '../plugin/PluginLoader';
import { queryValidation } from '../middleware/ValidateQueryMiddleware';
import { documentInfoExtraction } from '../middleware/ExtractDocumentInfoMiddleware';
import { metaEdModelFinding } from '../middleware/FindMetaEdModelMiddleware';
import { anonymizeAndLogRequestBody } from '../middleware/LogAnonymizedRequestMiddleware';
import { logTheResponse } from '../middleware/ResponseLoggingMiddleware';

type MiddlewareStack = (model: MiddlewareModel) => Promise<MiddlewareModel>;

const moduleName = 'core.handler.FrontendFacade';

/**
 * Initialization - anything here should be runnable more than once without impact
 */
async function initialize(): Promise<void> {
  initializeLogging();
  await ensurePluginsLoaded();
}

// Middleware stack builder for post - body, no id
function postStack(): MiddlewareStack {
  return R.once(
    R.pipe(
      authorize,
      R.andThen(parsePath),
      R.andThen(parseBody),
      R.andThen(anonymizeAndLogRequestBody),
      R.andThen(resourceValidation),
      R.andThen(metaEdModelFinding),
      R.andThen(documentValidation),
      R.andThen(documentInfoExtraction),
      R.andThen(getDocumentStore().securityMiddleware),
      R.andThen(logTheResponse),
    ),
  );
}

// Middleware stack builder for put, body and id
function putStack(): MiddlewareStack {
  return R.once(
    R.pipe(
      authorize,
      R.andThen(parsePath),
      R.andThen(parseBody),
      R.andThen(anonymizeAndLogRequestBody),
      R.andThen(resourceValidation),
      R.andThen(resourceIdValidation),
      R.andThen(metaEdModelFinding),
      R.andThen(documentValidation),
      R.andThen(documentInfoExtraction),
      R.andThen(getDocumentStore().securityMiddleware),
      R.andThen(logTheResponse),
    ),
  );
}

// Middleware stack builder for deletes - no body, has id
function deleteStack(): MiddlewareStack {
  return R.once(
    R.pipe(
      authorize,
      R.andThen(parsePath),
      R.andThen(resourceValidation),
      R.andThen(resourceIdValidation),
      R.andThen(getDocumentStore().securityMiddleware),
      R.andThen(logTheResponse),
    ),
  );
}

// Middleware stack builder for GetById - parsePath gets run earlier, no body, has id - document store security
function getByIdStack(): MiddlewareStack {
  return R.once(
    R.pipe(
      authorize,
      R.andThen(resourceValidation),
      R.andThen(resourceIdValidation),
      R.andThen(getDocumentStore().securityMiddleware),
      R.andThen(logTheResponse),
    ),
  );
}

// Middleware stack builder for Query - parsePath gets run earlier, no body
function queryStack(): MiddlewareStack {
  return R.once(
    R.pipe(
      authorize,
      R.andThen(resourceValidation),
      R.andThen(metaEdModelFinding),
      R.andThen(queryValidation),
      R.andThen(logTheResponse),
    ),
  );
}

/**
 * Handles query action
 */
export async function query(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    frontendRequest.action = 'query';

    await initialize();
    const stack: MiddlewareStack = queryStack();
    const model: MiddlewareModel = await stack({ frontendRequest, frontendResponse: null });

    // if there is a response posted by the stack, we are done
    if (model.frontendResponse != null) return model.frontendResponse;

    return await Query.query(model.frontendRequest);
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'query', 500, e);
    return { statusCode: 500 };
  }
}

/**
 * Handles getById action
 */
export async function getById(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    frontendRequest.action = 'getById';

    await initialize();
    const stack: MiddlewareStack = getByIdStack();
    const model: MiddlewareModel = await stack({ frontendRequest, frontendResponse: null });

    // if there is a response posted by the stack, we are done
    if (model.frontendResponse != null) return model.frontendResponse;

    return await GetById.getById(model.frontendRequest);
  } catch (e) {
    writeErrorToLog('FrontendFacade', frontendRequest.traceId, 'getById', 500, e);
    return { statusCode: 500 };
  }
}

/**
 * Entry point for all API GET requests, which determines the action type - get by id, or query
 */
export async function get(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    // determine query or "by id"
    const afterParsePath: MiddlewareModel = await parsePath({ frontendRequest, frontendResponse: null });
    const { resourceId } = afterParsePath.frontendRequest.middleware.pathComponents;

    // No resourceId in path means this is a query
    if (resourceId == null) {
      return await query(frontendRequest);
    }

    return await getById(frontendRequest);
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'get', 500, e);
    return { statusCode: 500 };
  }
}

/**
 * Entry point for API update actions, which are "by id"
 */
export async function update(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    frontendRequest.action = 'updateById';

    await initialize();
    const stack: MiddlewareStack = putStack();
    const model: MiddlewareModel = await stack({ frontendRequest, frontendResponse: null });

    // if there is a response posted by the stack, we are done
    if (model.frontendResponse != null) return model.frontendResponse;

    return await Update.update(model.frontendRequest);
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'update', 500, e);
    return { statusCode: 500 };
  }
}

/**
 * Entry point for API upsert actions
 */
export async function upsert(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    frontendRequest.action = 'upsert';

    await initialize();
    const stack: MiddlewareStack = postStack();
    const model: MiddlewareModel = await stack({ frontendRequest, frontendResponse: null });

    // if there is a response posted by the stack, we are done
    if (model.frontendResponse != null) return model.frontendResponse;

    return await Upsert.upsert(model.frontendRequest);
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'upsert', 500, e);
    return { statusCode: 500 };
  }
}

/**
 * Entry point for all delete actions, which are "by id"
 */
export async function deleteIt(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    frontendRequest.action = 'deleteById';

    await initialize();
    const stack: MiddlewareStack = deleteStack();
    const model: MiddlewareModel = await stack({ frontendRequest, frontendResponse: null });

    // if there is a response posted by the stack, we are done
    if (model.frontendResponse != null) return model.frontendResponse;

    return await Delete.deleteIt(model.frontendRequest);
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'deleteIt', 500, e);
    return { statusCode: 500 };
  }
}
