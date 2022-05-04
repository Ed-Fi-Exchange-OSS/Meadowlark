// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { loadMetaEdState } from '../metaed/LoadMetaEd';
import { modelPackageFor } from '../metaed/MetaEdProjectMetadata';
import { matchResourceNameToMetaEd, validateEntityBodyAgainstSchema } from '../metaed/MetaEdValidation';
import { extractDocumentReferences } from './DocumentReferenceExtractor';
import { extractDocumentIdentity, deriveAssignableFrom, DocumentIdentityWithSecurity } from './DocumentIdentityExtractor';
import { decapitalize } from '../Utility';
import { DocumentInfo, NoEntityInfo } from '../model/DocumentInfo';
import { DocumentReference } from '../model/DocumentReference';
import { extractDescriptorValues } from './DescriptorValueExtractor';
import { PathComponents } from '../model/PathComponents';
import { Assignable } from '../model/Assignable';
import { NoDocumentIdentity } from '../model/DocumentIdentity';

export type ResourceValidationResult = {
  /**
   * The name of the validated endpoint, corresponding to the name of the resource requested
   */
  endpointName?: string;
  /**
   * Metadata for the MetaEd project loaded
   */
  headerMetadata?: any;
  /**
   * Error messaging for validation failure
   */
  errorBody: string | null;
  /**
   * Information on the validated MetaEd entity matching the API request
   */
  documentInfo: DocumentInfo;
};

/**
 * Dynamically performs validation of a request against a resource.
 *
 * Starts by loading the MetaEd project specified in the endpoint path. Then uses the MetaEd internal
 * model, enriched by Meadowlark-specific enhancers, to validate the complete resource endpoint path.
 * If valid, continues by validating the request body (if any) for the resource. If valid, extracts
 * document identity and document reference information from the request body.
 */
export async function validateResource(
  pathComponents: PathComponents,
  body: object | null,
): Promise<ResourceValidationResult> {
  // Equally supporting resources with either upper or lower case names
  const lowerResourceName = decapitalize(pathComponents.endpointName);
  const modelNpmPackage = modelPackageFor(pathComponents.version);
  const { metaEd, metaEdConfiguration } = await loadMetaEdState(modelNpmPackage);

  const { resourceName, isDescriptor, exact, suggestion, matchingMetaEdModel } = matchResourceNameToMetaEd(
    lowerResourceName,
    metaEd,
    pathComponents.namespace,
  );
  const headerMetadata = {
    'X-MetaEd-Project-Name': metaEdConfiguration.projects[0].projectName,
    'X-MetaEd-Project-Version': metaEdConfiguration.projects[0].projectVersion,
    'X-MetaEd-Project-Package-Name': modelNpmPackage,
  };

  if (exact === false && suggestion === true) {
    const invalidResourceMessage = `Invalid resource '${pathComponents.endpointName}'. The most similar resource is '${resourceName}'.`;

    return {
      headerMetadata,
      endpointName: pathComponents.endpointName,
      documentInfo: NoEntityInfo,
      errorBody: JSON.stringify({
        message: invalidResourceMessage,
      }),
    };
  }

  if (exact === false && suggestion === false) {
    return {
      headerMetadata,
      endpointName: pathComponents.endpointName,
      documentInfo: NoEntityInfo,
      errorBody: JSON.stringify({ message: `Invalid resource '${pathComponents.endpointName}'.` }),
    };
  }

  let errorBody: string | null = null;
  let documentIdentityWithSecurity: DocumentIdentityWithSecurity = {
    documentIdentity: NoDocumentIdentity,
    studentId: null,
    edOrgId: null,
  };
  let assignableInfo: Assignable | null = null;
  const documentReferences: DocumentReference[] = [];
  const descriptorValues: DocumentReference[] = [];

  if (!isDescriptor && body != null) {
    const bodyValidation: string[] = validateEntityBodyAgainstSchema(matchingMetaEdModel, body);
    if (bodyValidation.length > 0) {
      errorBody = JSON.stringify({ message: bodyValidation });
    } else {
      documentIdentityWithSecurity = extractDocumentIdentity(matchingMetaEdModel, body);
      documentReferences.push(...extractDocumentReferences(matchingMetaEdModel, body));
      descriptorValues.push(...extractDescriptorValues(matchingMetaEdModel, body));
    }
  }

  if (!isDescriptor) {
    // We need to do this even if no body for deletes
    assignableInfo = deriveAssignableFrom(matchingMetaEdModel, documentIdentityWithSecurity.documentIdentity);
  }

  return {
    headerMetadata,
    endpointName: pathComponents.endpointName,
    documentInfo: {
      projectName: metaEdConfiguration.projects[0].projectName,
      projectVersion: metaEdConfiguration.projects[0].projectVersion,
      entityName: matchingMetaEdModel.metaEdName,
      isDescriptor,
      documentReferences,
      descriptorValues,
      ...documentIdentityWithSecurity,
      assignableInfo,
    },
    errorBody,
  };
}
