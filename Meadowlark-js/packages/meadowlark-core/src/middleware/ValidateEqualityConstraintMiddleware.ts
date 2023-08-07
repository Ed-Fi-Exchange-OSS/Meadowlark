// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugObject, writeRequestToLog } from '../Logger';
import { validateEqualityConstraints } from '../validation/EqualityConstraintValidator';
import { MiddlewareModel } from './MiddlewareModel';

const moduleName = 'core.middleware.ValidateEqualityConstraintMiddleware';

/**
 * Validates equality constraints for a JSON document. These constraints come from implicit and explicit
 * merges in the MetaEd model.
 */
export async function equalityConstraintValidation({
  frontendRequest,
  frontendResponse,
}: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'equalityConstraintValidation');

  const validationFailures: string[] = validateEqualityConstraints(
    frontendRequest.middleware.matchingMetaEdModel,
    frontendRequest.middleware.parsedBody,
  );

  if (validationFailures.length > 0) {
    const error = { error: validationFailures };
    const statusCode = 400;
    writeDebugObject(moduleName, frontendRequest, 'documentValidation', statusCode, error);
    return {
      frontendRequest,
      frontendResponse: { body: error, statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }

  return { frontendRequest, frontendResponse: null };
}
