// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/**
 * Base API resource information for passing along to backends
 */
export interface BaseResourceInfo {
  /**
   * The project name the API document resource is defined in e.g. "EdFi" for a data standard entity.
   */
  projectName: string;

  /**
   * The name of the resource. Typically, this is the same as the corresponding MetaEd entity name. However,
   * there are exceptions, for example descriptors have a "Descriptor" suffix on their resource name.
   */
  resourceName: string;

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
  resourceVersion: string;

  allowIdentityUpdates: boolean;
}

/**
 * Creates a new empty ResourceInfo object
 */
export function newResourceInfo(): ResourceInfo {
  return {
    resourceName: '',
    isDescriptor: false,
    projectName: '',
    resourceVersion: '',
    allowIdentityUpdates: false,
  };
}

/**
 * The null object for ResourceInfo
 */
export const NoResourceInfo = Object.freeze({
  ...newResourceInfo(),
  resourceName: 'NoResourceName',
  projectName: 'NoProjectName',
  namespace: 'NoNamespace',
  resourceVersion: '0.0.0',
});
