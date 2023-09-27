// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { SemVer } from './api-schema/SemVer';
import { MetaEdProjectName } from './api-schema/MetaEdProjectName';
import { MetaEdResourceName } from './api-schema/MetaEdResourceName';

/**
 * Base API resource information for passing along to backends
 */
export interface BaseResourceInfo {
  /**
   * The project name the API document resource is defined in e.g. "EdFi" for a data standard entity.
   */
  projectName: MetaEdProjectName;

  /**
   * The name of the resource. Typically, this is the same as the corresponding MetaEd entity name. However,
   * there are exceptions, for example descriptors have a "Descriptor" suffix on their resource name.
   */
  resourceName: MetaEdResourceName;

  /**
   * Whether this resource is a descriptor. Descriptors are treated differently from other documents
   */
  isDescriptor: boolean;
}

/**
 * API resource information including version
 */
export interface ResourceInfo extends BaseResourceInfo {
  /**
   * The project version the resource belongs to.
   */
  resourceVersion: SemVer;

  allowIdentityUpdates: boolean;
}

/**
 * Creates a new empty ResourceInfo object
 */
export function newResourceInfo(): ResourceInfo {
  return {
    resourceName: '' as MetaEdResourceName,
    isDescriptor: false,
    projectName: '' as MetaEdProjectName,
    resourceVersion: '' as SemVer,
    allowIdentityUpdates: false,
  };
}

/**
 * The null object for ResourceInfo
 */
export const NoResourceInfo: ResourceInfo = Object.freeze({
  resourceName: 'NoResourceName' as MetaEdResourceName,
  projectName: 'NoProjectName' as MetaEdProjectName,
  resourceVersion: '0.0.0' as SemVer,
  allowIdentityUpdates: false,
  isDescriptor: false,
});
