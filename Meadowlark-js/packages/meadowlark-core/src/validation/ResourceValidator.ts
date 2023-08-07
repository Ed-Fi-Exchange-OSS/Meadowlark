// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { normalizeDescriptorSuffix } from '@edfi/metaed-core';
import { loadMetaEdState } from '../metaed/LoadMetaEd';
import { modelPackageFor } from '../metaed/MetaEdProjectMetadata';
import { matchResourceNameToMetaEd } from '../metaed/MetaEdValidation';
import { decapitalize } from '../Utility';
import { PathComponents } from '../model/PathComponents';
import { NoResourceInfo, ResourceInfo } from '../model/ResourceInfo';

export type ResourceValidationResult = {
  /**
   * The name of the validated endpoint, corresponding to the name of the resource requested
   */
  resourceName: string;
  /**
   * Metadata for the MetaEd project loaded
   */
  headerMetadata?: any;
  /**
   * Error message for validation failure
   */
  errorBody?: {};
  /**
   * Information on the validated MetaEd entity matching the API request
   */
  resourceInfo: ResourceInfo;
};

/**
 * Dynamically performs validation of a request against a resource.
 *
 * Starts by loading the MetaEd project specified in the endpoint path. Then uses the MetaEd internal
 * model, enriched by Meadowlark-specific enhancers, to validate the complete resource endpoint path.
 */
export async function validateResource(pathComponents: PathComponents): Promise<ResourceValidationResult> {
  // Equally supporting resources with either upper or lower case names
  const lowerResourceName = decapitalize(pathComponents.resourceName);

  const modelNpmPackage = modelPackageFor(pathComponents.version);
  const { metaEd, metaEdConfiguration } = await loadMetaEdState(modelNpmPackage);

  const { resourceName, isDescriptor, exact, suggestion, matchingMetaEdModel } = matchResourceNameToMetaEd(
    lowerResourceName,
    metaEd,
    pathComponents.namespace,
  );
  const headerMetadata: object = {
    'X-MetaEd-Project-Name': metaEdConfiguration.projects[0].projectName,
    'X-MetaEd-Project-Version': metaEdConfiguration.projects[0].projectVersion,
    'X-MetaEd-Project-Package-Name': modelNpmPackage,
  };

  if (exact === false && suggestion === true) {
    const invalidResourceMessage = `Invalid resource '${pathComponents.resourceName}'. The most similar resource is '${resourceName}'.`;

    return {
      headerMetadata,
      resourceName: pathComponents.resourceName,
      resourceInfo: NoResourceInfo,
      errorBody: {
        error: invalidResourceMessage,
      },
    };
  }

  if (exact === false && suggestion === false) {
    return {
      headerMetadata,
      resourceName: pathComponents.resourceName,
      resourceInfo: NoResourceInfo,
      errorBody: { error: `Invalid resource '${pathComponents.resourceName}'.` },
    };
  }

  return {
    headerMetadata,
    resourceName: pathComponents.resourceName,
    resourceInfo: {
      projectName: metaEdConfiguration.projects[0].projectName,
      resourceVersion: metaEdConfiguration.projects[0].projectVersion,
      resourceName: isDescriptor
        ? normalizeDescriptorSuffix(matchingMetaEdModel.metaEdName)
        : matchingMetaEdModel.metaEdName,
      isDescriptor,
      allowIdentityUpdates: matchingMetaEdModel.allowPrimaryKeyUpdates,
    },
  };
}
