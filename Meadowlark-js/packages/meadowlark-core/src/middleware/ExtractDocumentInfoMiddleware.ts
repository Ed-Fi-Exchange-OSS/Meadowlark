// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';
import { DocumentInfo, NoDocumentInfo } from '../model/DocumentInfo';
import { extractDocumentInfo } from '../extraction/DocumentInfoExtractor';

const moduleName = 'core.middleware.ExtractDocumentInfoMiddleware';

/**
 * Extracts identity and reference information from a valid JSON document
 */
export async function documentInfoExtraction({
  frontendRequest,
  frontendResponse,
}: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };
  writeRequestToLog(moduleName, frontendRequest, 'documentInfoExtraction');

  const documentInfo: DocumentInfo = await extractDocumentInfo(
    frontendRequest.middleware.resourceInfo,
    frontendRequest.middleware.parsedBody,
    frontendRequest.middleware.matchingMetaEdModel,
    frontendRequest.middleware.timestamp,
  );

  if (documentInfo === NoDocumentInfo) {
    const statusCode = 404;
    writeDebugStatusToLog(moduleName, frontendRequest, 'documentInfoExtraction', statusCode);
    return {
      frontendRequest,
      frontendResponse: { statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }

  frontendRequest.middleware.documentInfo = documentInfo;
  return { frontendRequest, frontendResponse: null };
}
