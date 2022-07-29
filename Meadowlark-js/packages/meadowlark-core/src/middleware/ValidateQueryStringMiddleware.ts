// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { confirmThatPropertiesBelongToDocumentType } from '../validation/DocumentValidator';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';
import { validatePaginationParameters } from '../validation/PaginationValidator';

const moduleName = 'ValidateQueryStringMiddleware';

/**
 * Validates that query string parameters belong with this resource type.
 */
export async function validateQueryString({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'validateQueryString');

  // if there are no query string parameters, we are done
  if (Object.keys(frontendRequest.queryStringParameters).length === 0) {
    return { frontendRequest, frontendResponse: null };
  }

  const { limit, offset } = frontendRequest.queryStringParameters;
  const paginationValidationResult = validatePaginationParameters({ limit, offset });

  if (paginationValidationResult != null) {
    const statusCode = 400;
    writeDebugStatusToLog(moduleName, frontendRequest, 'validateQueryString', statusCode, paginationValidationResult);
    return {
      frontendRequest,
      frontendResponse: { body: paginationValidationResult, statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }

  const removeDisallowedQueryParameters = R.omit(['offset', 'limit', 'totalCount']);
  const queryStringParameters = removeDisallowedQueryParameters(frontendRequest.queryStringParameters);

  const { errorBody } = await confirmThatPropertiesBelongToDocumentType(
    frontendRequest.middleware.pathComponents,
    queryStringParameters,
    frontendRequest.traceId,
  );

  if (errorBody != null) {
    const statusCode = 400;
    writeDebugStatusToLog(moduleName, frontendRequest, 'validateQueryString', statusCode, errorBody);
    return {
      frontendRequest,
      frontendResponse: { body: errorBody, statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }

  return { frontendRequest, frontendResponse: null };
}
