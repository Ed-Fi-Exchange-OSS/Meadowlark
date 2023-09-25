// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { extractDocumentReferences } from './DocumentReferenceExtractor';
import { extractDocumentIdentity } from './DocumentIdentityExtractor';
import { DocumentInfo } from '../model/DocumentInfo';
import { extractDescriptorValues } from './DescriptorValueExtractor';
import { SuperclassInfo } from '../model/SuperclassInfo';
import { DocumentIdentity } from '../model/DocumentIdentity';
import { ResourceSchema } from '../model/api-schema/ResourceSchema';
import { deriveSuperclassInfoFrom } from './SuperclassInfoExtractor';

/**
 * Extracts document identity and document reference information from the request body.
 */
export async function extractDocumentInfo(
  resourceSchema: ResourceSchema,
  body: object,
  requestTimestamp: number,
): Promise<DocumentInfo> {
  const documentIdentity: DocumentIdentity = extractDocumentIdentity(resourceSchema, body);

  let superclassInfo: SuperclassInfo | null = null;
  if (!resourceSchema.isDescriptor) {
    // We need to do this even if we have no body, for deletes
    superclassInfo = deriveSuperclassInfoFrom(resourceSchema, documentIdentity);
  }

  return {
    documentReferences: extractDocumentReferences(resourceSchema, body),
    descriptorReferences: extractDescriptorValues(resourceSchema, body),
    documentIdentity,
    superclassInfo,
    requestTimestamp,
  };
}
