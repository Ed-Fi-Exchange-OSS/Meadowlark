// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';
import { validatePaginationParameters } from '../validation/PaginationValidator';
import { validateQueryString } from '../validation/QueryStringValidator';
import { PaginationParameters } from '../message/PaginationParameters';

const moduleName = 'ValidateQueryMiddleware';

/**
 * Validates that query parameters belong with this resource type.
 */
export async function queryValidation({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };

  writeRequestToLog(moduleName, frontendRequest, 'queryValidation');

  // if there are no query parameters, we are done
  if (Object.keys(frontendRequest.queryParameters).length === 0) {
    return { frontendRequest, frontendResponse: null };
  }

  const { limit, offset }: PaginationParameters = frontendRequest.queryParameters;
  const paginationValidationResult = validatePaginationParameters({ limit, offset });

  if (paginationValidationResult != null) {
    const statusCode = 400;
    writeDebugStatusToLog(moduleName, frontendRequest, 'queryValidation', statusCode, paginationValidationResult);
    return {
      frontendRequest,
      frontendResponse: { body: paginationValidationResult, statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }

  const removeDisallowedQueryParameters = R.omit(['offset', 'limit', 'totalCount']);
  const queryParameters = removeDisallowedQueryParameters(frontendRequest.queryParameters);

  const { errorBody } = await validateQueryString(queryParameters, frontendRequest.middleware.matchingMetaEdModel);

  if (errorBody != null) {
    const statusCode = 400;
    writeDebugStatusToLog(moduleName, frontendRequest, 'queryValidation', statusCode, errorBody);
    return {
      frontendRequest,
      frontendResponse: { body: errorBody, statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }

  return { frontendRequest, frontendResponse: null };
}
