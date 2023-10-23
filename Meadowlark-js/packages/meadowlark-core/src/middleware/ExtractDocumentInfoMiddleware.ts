// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';
import { DocumentInfo, NoDocumentInfo } from '../model/DocumentInfo';
import { extractDescriptorValues } from '../extraction/DescriptorValueExtractor';
import { extractDocumentIdentity } from '../extraction/DocumentIdentityExtractor';
import { extractDocumentReferences } from '../extraction/DocumentReferenceExtractor';
import { deriveSuperclassInfoFrom } from '../extraction/SuperclassInfoExtractor';
import { DocumentIdentity } from '../model/DocumentIdentity';
import { SuperclassInfo } from '../model/SuperclassInfo';
import { ApiSchema } from '../model/api-schema/ApiSchema';
import { ResourceSchema } from '../model/api-schema/ResourceSchema';

const moduleName = 'core.middleware.ExtractDocumentInfoMiddleware';

/**
 * Builds a DocumentInfo using the various extractors
 */
export function buildDocumentInfo(
  apiSchema: ApiSchema,
  resourceSchema: ResourceSchema,
  body: object,
  requestTimestamp: number,
): DocumentInfo {
  const documentIdentity: DocumentIdentity = extractDocumentIdentity(resourceSchema, body);

  let superclassInfo: SuperclassInfo | null = null;
  if (!resourceSchema.isDescriptor) {
    // We need to do this even if we have no body, for deletes
    superclassInfo = deriveSuperclassInfoFrom(resourceSchema, documentIdentity);
  }

  return {
    documentReferences: extractDocumentReferences(apiSchema, resourceSchema, body),
    descriptorReferences: extractDescriptorValues(resourceSchema, body),
    documentIdentity,
    superclassInfo,
    requestTimestamp,
  };
}

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

  const documentInfo: DocumentInfo = buildDocumentInfo(
    frontendRequest.middleware.apiSchema,
    frontendRequest.middleware.resourceSchema,
    frontendRequest.middleware.parsedBody,
    frontendRequest.middleware.timestamp,
  );

  if (documentInfo === NoDocumentInfo) {
    const statusCode = 404;
    writeDebugStatusToLog(moduleName, frontendRequest.traceId, 'documentInfoExtraction', statusCode);
    return {
      frontendRequest,
      frontendResponse: { statusCode, headers: frontendRequest.middleware.headerMetadata },
    };
  }

  frontendRequest.middleware.documentInfo = documentInfo;
  return { frontendRequest, frontendResponse: null };
}
