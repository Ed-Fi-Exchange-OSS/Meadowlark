// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Assignable } from './Assignable';
import { DocumentIdentity, NoDocumentIdentity } from './DocumentIdentity';
import { DocumentReference } from './DocumentReference';

/**
 * Type information for an API document
 */
export interface DocumentTypeInfo {
  /**
   * The MetaEd project name the API document resource is defined in e.g. "EdFi" for a data standard entity.
   */
  projectName: string;

  /**
   * The MetaEd project version the entity belongs to.
   */
  resourceVersion: string;
  /**
   * The name of the resource. Typically, this is the same as the corresponding MetaEd entity name. However,
   * there are exceptions, for example descriptors have a "Descriptor" suffix on their resource name.
   */
  resourceName: string;
  /**
   * Whether this document is a descriptor. Descriptors are treated differently from other documents
   */
  isDescriptor: boolean;
}

/**
 * Information to uniquely identify an API document by the elements that make up its identity
 */
export interface DocumentIdentifyingInfo extends DocumentTypeInfo {
  /**
   * The identity elements extracted from the API document
   */
  documentIdentity: DocumentIdentity;
}

/**
 * Complete information on a validated API document
 */
export interface DocumentInfo extends DocumentIdentifyingInfo {
  /**
   * A list of the document references extracted from the API document
   */
  documentReferences: DocumentReference[];

  /**
   * A list of the non-reference (meaning top-level only) descriptor values of the entity extracted from the API document
   */
  descriptorValues: DocumentReference[];

  /**
   * If this resource is assignable to another resource (meaning it is part of a subclass/superclass relationship)
   * this is the assignable document identity and superclass information.
   */
  assignableInfo: Assignable | null;

  /**
   * The student id extracted from the API document, if any (for security)
   */
  studentId: string | null;

  /**
   * The education organization id extracted from the API document, if any (for security)
   */
  edOrgId: string | null;
}

/**
 * Creates a new empty DocumentInfo object
 */
export function newDocumentInfo(): DocumentInfo {
  return {
    resourceName: '',
    isDescriptor: false,
    projectName: '',
    resourceVersion: '',
    documentIdentity: NoDocumentIdentity,
    assignableInfo: null,
    documentReferences: [],
    descriptorValues: [],
    studentId: null,
    edOrgId: null,
  };
}

/**
 * The null object for DocumentInfo
 */
export const NoDocumentInfo = {
  ...newDocumentInfo(),
  resourceName: 'NoResourceName',
  projectName: 'NoProjectName',
  resourceVersion: '0.0.0',
};
