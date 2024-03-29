// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo } from '../model/DocumentInfo';
import { extractDescriptorValues } from './DescriptorValueExtractor';
import { extractDocumentIdentity } from './DocumentIdentityExtractor';
import { extractDocumentReferences } from './DocumentReferenceExtractor';
import { deriveSuperclassInfoFrom } from './SuperclassInfoExtractor';
import { DocumentIdentity } from '../model/DocumentIdentity';
import { SuperclassInfo } from '../model/SuperclassInfo';
import { ApiSchema } from '../model/api-schema/ApiSchema';
import { ResourceSchema } from '../model/api-schema/ResourceSchema';

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
