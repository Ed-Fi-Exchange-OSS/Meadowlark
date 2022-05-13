// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import R from 'ramda';
import { writeErrorToLog } from '../Logger';
import { authenticate } from '../middleware/AuthenticationMiddleware';
import { MiddlewareChain } from '../middleware/MiddlewareChain';
import { parsePath } from '../middleware/ParsePathMiddleware';
import { parseBody } from '../middleware/ParseBodyMiddleware';
import { validateResource } from '../middleware/ValidateResourceMiddleware';
import { noBody } from '../middleware/NoBodyMiddleware';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';
import * as Upsert from './Upsert';
import * as Update from './Update';
import * as Delete from './Delete';
import * as Get from './Get';

// Middleware stack for methods with a body in the request (POST, PUT)
const methodWithBodyStack: (chain: MiddlewareChain) => Promise<MiddlewareChain> = R.pipe(
  authenticate,
  R.andThen(parsePath),
  R.andThen(parseBody),
  R.andThen(validateResource),
);

// Middleware stack for methods without a body in the request (GET, DELETE)
const methodWithoutBodyStack: (chain: MiddlewareChain) => Promise<MiddlewareChain> = R.pipe(
  authenticate,
  R.andThen(parsePath),
  R.andThen(noBody),
  R.andThen(validateResource),
);

/**
 * Entry point for all API GET requests, both "by id" and query
 */
export async function getResolver(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    const chain: MiddlewareChain = await methodWithoutBodyStack({ frontendRequest, frontendResponse: null });
    if (chain.frontendResponse != null) return chain.frontendResponse;
    return await Get.getResolver(chain.frontendRequest);
  } catch (e) {
    writeErrorToLog('FrontendFacade.deleteIt', frontendRequest.traceId, 'deleteIt', 500, e);
    return { body: '', statusCode: 500 };
  }
}

/**
 * Entry point for API update requests, which are "by id"
 */
export async function update(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    const chain: MiddlewareChain = await methodWithBodyStack({ frontendRequest, frontendResponse: null });
    if (chain.frontendResponse != null) return chain.frontendResponse;
    return await Update.update(chain.frontendRequest);
  } catch (e) {
    writeErrorToLog('FrontendFacade.upsert', frontendRequest.traceId, 'create', 500, e);
    return { body: '', statusCode: 500 };
  }
}

/**
 * Entry point for API upsert requests
 */
export async function upsert(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    const chain: MiddlewareChain = await methodWithBodyStack({ frontendRequest, frontendResponse: null });
    if (chain.frontendResponse != null) return chain.frontendResponse;
    return await Upsert.upsert(chain.frontendRequest);
  } catch (e) {
    writeErrorToLog('FrontendFacade.upsert', frontendRequest.traceId, 'create', 500, e);
    return { body: '', statusCode: 500 };
  }
}

/**
 * Entry point for all API DELETE requests, which are "by id"
 */
export async function deleteIt(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    const chain: MiddlewareChain = await methodWithoutBodyStack({ frontendRequest, frontendResponse: null });
    if (chain.frontendResponse != null) return chain.frontendResponse;
    return await Delete.deleteIt(chain.frontendRequest);
  } catch (e) {
    writeErrorToLog('FrontendFacade.deleteIt', frontendRequest.traceId, 'deleteIt', 500, e);
    return { body: '', statusCode: 500 };
  }
}
