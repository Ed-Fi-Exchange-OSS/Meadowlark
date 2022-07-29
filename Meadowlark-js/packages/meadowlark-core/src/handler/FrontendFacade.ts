// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import R from 'ramda';
import { writeErrorToLog } from '../Logger';
import { authorize } from '../middleware/AuthorizationMiddleware';
import { MiddlewareModel } from '../middleware/MiddlewareModel';
import { parsePath } from '../middleware/ParsePathMiddleware';
import { parseBody } from '../middleware/ParseBodyMiddleware';
import { resourceValidation } from '../middleware/ValidateResourceMiddleware';
import { documentValidation } from '../middleware/ValidateDocumentMiddleware';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';
import * as Upsert from './Upsert';
import * as Update from './Update';
import * as Delete from './Delete';
import * as Query from './Query';
import * as GetById from './GetById';
import { ensurePluginsLoaded, getDocumentStore } from '../plugin/PluginLoader';
import { validateQueryString } from '../middleware/ValidateQueryStringMiddleware';

type MiddlewareStack = (model: MiddlewareModel) => Promise<MiddlewareModel>;

// Middleware stack builder for methods with a body in the request (POST, PUT)
function methodWithBodyStack(): MiddlewareStack {
  return R.once(
    R.pipe(
      authorize,
      R.andThen(parsePath),
      R.andThen(parseBody),
      R.andThen(resourceValidation),
      R.andThen(documentValidation),
      R.andThen(getDocumentStore().securityMiddleware),
    ),
  );
}

// Middleware stack builder for deletes - no body
function deleteStack(): MiddlewareStack {
  return R.once(
    R.pipe(authorize, R.andThen(parsePath), R.andThen(resourceValidation), R.andThen(getDocumentStore().securityMiddleware)),
  );
}

// Middleware stack builder for GetById - parsePath gets run earlier, no body - document store security
function getByIdStack(): MiddlewareStack {
  return R.once(R.pipe(authorize, R.andThen(resourceValidation), R.andThen(getDocumentStore().securityMiddleware)));
}

// Middleware stack builder for Query - parsePath gets run earlier, no body
function queryStack(): MiddlewareStack {
  return R.once(R.pipe(authorize, R.andThen(resourceValidation), R.andThen(validateQueryString)));
}

/**
 * Handles query action
 */
export async function query(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    frontendRequest.action = 'query';

    await ensurePluginsLoaded();
    const stack: MiddlewareStack = queryStack();
    const model: MiddlewareModel = await stack({ frontendRequest, frontendResponse: null });

    // if there is a response posted by the stack, we are done
    if (model.frontendResponse != null) return model.frontendResponse;

    return await Query.query(model.frontendRequest);
  } catch (e) {
    writeErrorToLog('FrontendFacade.query', frontendRequest.traceId, 'create', 500, e);
    return { body: '', statusCode: 500 };
  }
}

/**
 * Handles getById action
 */
export async function getById(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    frontendRequest.action = 'getById';

    await ensurePluginsLoaded();
    const stack: MiddlewareStack = getByIdStack();
    const model: MiddlewareModel = await stack({ frontendRequest, frontendResponse: null });

    // if there is a response posted by the stack, we are done
    if (model.frontendResponse != null) return model.frontendResponse;

    return await GetById.getById(model.frontendRequest);
  } catch (e) {
    writeErrorToLog('FrontendFacade.getById', frontendRequest.traceId, 'create', 500, e);
    return { body: '', statusCode: 500 };
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
    writeErrorToLog('FrontendFacade.get', frontendRequest.traceId, 'deleteIt', 500, e);
    return { body: '', statusCode: 500 };
  }
}

/**
 * Entry point for API update actions, which are "by id"
 */
export async function update(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    frontendRequest.action = 'updateById';

    await ensurePluginsLoaded();
    const stack: MiddlewareStack = methodWithBodyStack();
    const model: MiddlewareModel = await stack({ frontendRequest, frontendResponse: null });

    // if there is a response posted by the stack, we are done
    if (model.frontendResponse != null) return model.frontendResponse;

    return await Update.update(model.frontendRequest);
  } catch (e) {
    writeErrorToLog('FrontendFacade.update', frontendRequest.traceId, 'create', 500, e);
    return { body: '', statusCode: 500 };
  }
}

/**
 * Entry point for API upsert actions
 */
export async function upsert(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    frontendRequest.action = 'upsert';

    await ensurePluginsLoaded();
    const stack: MiddlewareStack = methodWithBodyStack();
    const model: MiddlewareModel = await stack({ frontendRequest, frontendResponse: null });

    // if there is a response posted by the stack, we are done
    if (model.frontendResponse != null) return model.frontendResponse;

    return await Upsert.upsert(model.frontendRequest);
  } catch (e) {
    writeErrorToLog('FrontendFacade.upsert', frontendRequest.traceId, 'create', 500, e);
    return { body: '', statusCode: 500 };
  }
}

/**
 * Entry point for all delete actions, which are "by id"
 */
export async function deleteIt(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    frontendRequest.action = 'deleteById';

    await ensurePluginsLoaded();
    const stack: MiddlewareStack = deleteStack();
    const model: MiddlewareModel = await stack({ frontendRequest, frontendResponse: null });

    // if there is a response posted by the stack, we are done
    if (model.frontendResponse != null) return model.frontendResponse;

    return await Delete.deleteIt(model.frontendRequest);
  } catch (e) {
    writeErrorToLog('FrontendFacade.deleteIt', frontendRequest.traceId, 'deleteIt', 500, e);
    return { body: '', statusCode: 500 };
  }
}
