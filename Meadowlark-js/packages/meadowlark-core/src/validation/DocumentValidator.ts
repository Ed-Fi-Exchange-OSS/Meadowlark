// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { TopLevelEntity } from '@edfi/metaed-core';
import { loadMetaEdState } from '../metaed/LoadMetaEd';
import { modelPackageFor } from '../metaed/MetaEdProjectMetadata';
import { validateEntityBodyAgainstSchema } from '../metaed/MetaEdValidation';
import { extractDocumentReferences } from './DocumentReferenceExtractor';
import { extractDocumentIdentity, deriveAssignableFrom, DocumentIdentityWithSecurity } from './DocumentIdentityExtractor';
import { decapitalize } from '../Utility';
import { DocumentInfo, NoDocumentInfo } from '../model/DocumentInfo';
import { DocumentReference } from '../model/DocumentReference';
import { extractDescriptorValues } from './DescriptorValueExtractor';
import { Assignable } from '../model/Assignable';
import { NoDocumentIdentity } from '../model/DocumentIdentity';
import { ResourceInfo } from '../model/ResourceInfo';
import { getMatchingMetaEdModelFrom } from '../metaed/ResourceNameMapping';
import { Logger } from '../Logger';
import { PathComponents } from '../model/PathComponents';

export type DocumentValidationResult = {
  /**
   * Error message for validation failure
   */
  errorBody?: string;
  /**
   * Information on the validated document from the API request
   */
  documentInfo: DocumentInfo;
};

/**
 * Dynamically performs validation of a document against a resource.
 *
 * Validates the request body for the resource. If valid, extracts
 * document identity and document reference information from the request body.
 */
export async function validateDocument(
  pathComponents: PathComponents,
  resourceInfo: ResourceInfo,
  body: object,
  traceId: string,
): Promise<DocumentValidationResult> {
  const lowerResourceName = decapitalize(pathComponents.endpointName);
  const modelNpmPackage = modelPackageFor(pathComponents.version);
  const { metaEd } = await loadMetaEdState(modelNpmPackage);

  const matchingMetaEdModel: TopLevelEntity | undefined = getMatchingMetaEdModelFrom(
    lowerResourceName,
    metaEd,
    pathComponents.namespace,
  );

  if (matchingMetaEdModel == null) {
    Logger.error('DocumentValidator.validateDocument: Fatal error - matchingMetaEdModel not found', traceId);
    return { errorBody: 'Fatal error', documentInfo: NoDocumentInfo };
  }

  let errorBody: string | undefined;
  let documentIdentityWithSecurity: DocumentIdentityWithSecurity = {
    documentIdentity: NoDocumentIdentity,
    studentId: null,
    edOrgId: null,
  };
  let assignableInfo: Assignable | null = null;
  const documentReferences: DocumentReference[] = [];
  const descriptorReferences: DocumentReference[] = [];

  if (!resourceInfo.isDescriptor && body != null) {
    const bodyValidation: string[] = validateEntityBodyAgainstSchema(matchingMetaEdModel, body);
    if (bodyValidation.length > 0) {
      errorBody = JSON.stringify({ message: bodyValidation });
    } else {
      documentIdentityWithSecurity = extractDocumentIdentity(matchingMetaEdModel, body);
      documentReferences.push(...extractDocumentReferences(matchingMetaEdModel, body));
      descriptorReferences.push(...extractDescriptorValues(matchingMetaEdModel, body));
    }
  }

  if (!resourceInfo.isDescriptor) {
    // We need to do this even if no body for deletes
    assignableInfo = deriveAssignableFrom(matchingMetaEdModel, documentIdentityWithSecurity.documentIdentity);
  }

  return {
    documentInfo: {
      documentReferences,
      descriptorReferences,
      ...documentIdentityWithSecurity,
      assignableInfo,
    },
    errorBody,
  };
}
