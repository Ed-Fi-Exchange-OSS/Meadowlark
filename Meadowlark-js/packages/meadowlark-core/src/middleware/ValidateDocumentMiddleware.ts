// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { validateDocument } from '../validation/DocumentValidator';
import { writeDebugObject, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';
import { FrontendRequest } from '../handler/FrontendRequest';

const moduleName = 'core.middleware.ValidateDocumentMiddleware';

/**
 * Validates JSON document shape
 */
export async function documentValidation({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'documentValidation');
  const error: object | null = await validateDocument(
    frontendRequest.middleware.parsedBody,
    frontendRequest.middleware.matchingMetaEdModel,
  );

  if (error != null) {
    const statusCode = 400;
    writeDebugObject(moduleName, frontendRequest, 'documentValidation', statusCode, error);
    return {
      frontendRequest,
      frontendResponse: { body: error, statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }

  return { frontendRequest, frontendResponse: null };
}

/**
 * Validates JSON document shape for the update function
 */
export async function documentUpdateValidation({
  frontendRequest,
  frontendResponse,
}: MiddlewareModel): Promise<MiddlewareModel> {
  const id = {
    type: 'string',
    description: 'The item id',
  };
  // Add id to schema to validate document
  const frontendRequestUpdate: FrontendRequest = {
    ...frontendRequest,
    middleware: {
      ...frontendRequest.middleware,
      matchingMetaEdModel: {
        ...frontendRequest.middleware.matchingMetaEdModel,
        data: {
          ...frontendRequest.middleware.matchingMetaEdModel.data,
          edfiApiSchema: {
            ...frontendRequest.middleware.matchingMetaEdModel.data.edfiApiSchema,
            jsonSchema: {
              ...frontendRequest.middleware.matchingMetaEdModel.data.edfiApiSchema.jsonSchema,
              properties: {
                id,
                ...frontendRequest.middleware.matchingMetaEdModel.data.edfiApiSchema.jsonSchema.properties,
              },
            },
          },
        },
      },
    },
  };

  return documentValidation({ frontendRequest: frontendRequestUpdate, frontendResponse });
}
