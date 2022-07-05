// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { SuperclassInfo } from './SuperclassInfo';
import { NoDocumentIdentity, documentIdForDocumentIdentity } from './DocumentIdentity';
import type { DocumentIdentity } from './DocumentIdentity';
import type { DocumentReference } from './DocumentReference';
import { ResourceInfo } from './ResourceInfo';

/**
 * Complete information on a validated API document
 */
export interface DocumentInfo {
  /**
   * The identity elements extracted from the API document
   */
  documentIdentity: DocumentIdentity;

  /**
   * A list of the document references extracted from the API document
   */
  documentReferences: DocumentReference[];

  /**
   * A list of the non-reference (meaning top-level only) descriptor values of the entity extracted from the API document
   */
  descriptorReferences: DocumentReference[];

  /**
   * If this document is a subclass, this provides the document superclass information.
   */
  superclassInfo: SuperclassInfo | null;

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
    documentIdentity: NoDocumentIdentity,
    superclassInfo: null,
    documentReferences: [],
    descriptorReferences: [],
    studentId: null,
    edOrgId: null,
  };
}

/**
 * The null object for DocumentInfo
 */
export const NoDocumentInfo = Object.freeze({
  ...newDocumentInfo(),
});

/**
 * Returns the id of the given DocumentInfo, using the project name, resource name and identity of the API document.
 */
export function documentIdForDocumentInfo(resourceInfo: ResourceInfo, documentInfo: DocumentInfo): string {
  return documentIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);
}
