// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { TopLevelEntity } from '@edfi/metaed-core';
import { loadMetaEdState } from '../metaed/LoadMetaEd';
import { modelPackageFor } from '../metaed/MetaEdProjectMetadata';
import { validateEntityBodyAgainstSchema, validatePartialEntityBodyAgainstSchema } from '../metaed/MetaEdValidation';
import { extractDocumentReferences } from './DocumentReferenceExtractor';
import { extractDocumentIdentity, deriveSuperclassInfoFrom } from './DocumentIdentityExtractor';
import { decapitalize } from '../Utility';
import { DocumentInfo, NoDocumentInfo } from '../model/DocumentInfo';
import { DocumentReference } from '../model/DocumentReference';
import { extractDescriptorValues } from './DescriptorValueExtractor';
import { SuperclassInfo } from '../model/SuperclassInfo';
import { DocumentIdentity, NoDocumentIdentity } from '../model/DocumentIdentity';
import { ResourceInfo } from '../model/ResourceInfo';
import { getMetaEdModelForResourceName } from '../metaed/ResourceNameMapping';
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

export type PropertyValidationResult = {
  /**
   * Error message for validation failure
   */
  errorBody?: string;
};

async function getMatchingMetaEdModel(pathComponents: PathComponents): Promise<TopLevelEntity | undefined> {
  const lowerResourceName = decapitalize(pathComponents.endpointName);
  const modelNpmPackage = modelPackageFor(pathComponents.version);
  const { metaEd } = await loadMetaEdState(modelNpmPackage);

  return getMetaEdModelForResourceName(lowerResourceName, metaEd, pathComponents.namespace);
}

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
  const matchingMetaEdModel = await getMatchingMetaEdModel(pathComponents);

  if (matchingMetaEdModel == null) {
    Logger.error('DocumentValidator.validateDocument: Fatal error - matchingMetaEdModel not found', traceId);
    return { errorBody: 'Fatal error', documentInfo: NoDocumentInfo };
  }

  let errorBody: string | undefined;
  let documentIdentity: DocumentIdentity = NoDocumentIdentity;
  let superclassInfo: SuperclassInfo | null = null;
  const documentReferences: DocumentReference[] = [];
  const descriptorReferences: DocumentReference[] = [];

  if (body != null) {
    const bodyValidation: string[] = validateEntityBodyAgainstSchema(matchingMetaEdModel, body);
    if (bodyValidation.length > 0) {
      errorBody = JSON.stringify({ message: bodyValidation });
    } else {
      documentIdentity = extractDocumentIdentity(matchingMetaEdModel, body);
      documentReferences.push(...extractDocumentReferences(matchingMetaEdModel, body));
      descriptorReferences.push(...extractDescriptorValues(matchingMetaEdModel, body));
    }
  }

  if (!resourceInfo.isDescriptor) {
    // We need to do this even if no body for deletes
    superclassInfo = deriveSuperclassInfoFrom(matchingMetaEdModel, documentIdentity);
  }

  return {
    documentInfo: {
      documentReferences,
      descriptorReferences,
      documentIdentity,
      superclassInfo,
    },
    errorBody,
  };
}

/**
 * Validates that the provided object properties belong with the MetaEd resource specified by the PathComponents.
 */
export async function confirmThatPropertiesBelongToDocumentType(
  pathComponents: PathComponents,
  properties: object,
  traceId: string,
): Promise<PropertyValidationResult> {
  const matchingMetaEdModel = await getMatchingMetaEdModel(pathComponents);

  if (matchingMetaEdModel == null) {
    Logger.error(
      'DocumentValidator.confirmThatPropertiesBelongToDocumentType: Fatal error - matchingMetaEdModel not found',
      traceId,
    );
    return { errorBody: 'Fatal error' };
  }

  const bodyValidation: string[] = validatePartialEntityBodyAgainstSchema(matchingMetaEdModel, properties);
  if (bodyValidation.length > 0) {
    return {
      errorBody: JSON.stringify({ invalidQueryTerms: bodyValidation }),
    };
  }

  return {};
}
