// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EntityMeadowlarkData } from '@edfi/metaed-plugin-edfi-meadowlark';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { validateDocument } from '../validation/SchoolYearValidator';
import { MiddlewareModel } from './MiddlewareModel';

const moduleName = 'ValidateSchoolYearMiddleware';

/**
 * Validates resource
 */
export async function schoolYearValidation({
  frontendRequest,
  frontendResponse,
}: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'schoolYearValidation');

  const meadowlarkEntity: EntityMeadowlarkData = frontendRequest.middleware.matchingMetaEdModel.data
    .meadowlark as EntityMeadowlarkData;

  if (meadowlarkEntity.hasSchoolYear) {
    const errorBody = validateDocument(frontendRequest.middleware.parsedBody);

    if (errorBody !== '') {
      const statusCode = 400;
      writeDebugStatusToLog(moduleName, frontendRequest, 'schoolYearValidation', statusCode, errorBody);
      return {
        frontendRequest,
        frontendResponse: { body: errorBody, statusCode, headers: frontendRequest.middleware.headerMetadata },
      };
    }
  }

  return { frontendRequest, frontendResponse: null };
}