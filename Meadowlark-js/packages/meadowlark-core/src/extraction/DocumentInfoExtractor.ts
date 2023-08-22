// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { TopLevelEntity } from '@edfi/metaed-core';
import { extractDocumentReferences } from './DocumentReferenceExtractor';
import { extractDocumentIdentity, deriveSuperclassInfoFrom } from './DocumentIdentityExtractor';
import { DocumentInfo } from '../model/DocumentInfo';
import { extractDescriptorValues } from './DescriptorValueExtractor';
import { SuperclassInfo } from '../model/SuperclassInfo';
import { DocumentIdentity } from '../model/DocumentIdentity';
import { ResourceInfo } from '../model/ResourceInfo';

/**
 * Extracts document identity and document reference information from the request body.
 */
export async function extractDocumentInfo(
  resourceInfo: ResourceInfo,
  body: object,
  matchingMetaEdModel: TopLevelEntity,
  requestTimestamp: number,
): Promise<DocumentInfo> {
  const documentIdentity: DocumentIdentity = extractDocumentIdentity(matchingMetaEdModel, body);

  let superclassInfo: SuperclassInfo | null = null;
  if (!resourceInfo.isDescriptor) {
    // We need to do this even if no body for deletes
    superclassInfo = deriveSuperclassInfoFrom(matchingMetaEdModel, documentIdentity);
  }

  return {
    documentReferences: extractDocumentReferences(matchingMetaEdModel, body),
    descriptorReferences: extractDescriptorValues(matchingMetaEdModel, body),
    documentIdentity,
    superclassInfo,
    requestTimestamp,
  };
}
