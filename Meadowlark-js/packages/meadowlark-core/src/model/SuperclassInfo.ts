// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MeadowlarkId } from './IdTypes';
import { meadowlarkIdForDocumentIdentity, NoDocumentIdentity } from './DocumentIdentity';
import type { DocumentIdentity } from './DocumentIdentity';
import type { BaseResourceInfo } from './ResourceInfo';

/**
 * The optional superclass information for a DocumentInfo. Applies only to documents that are subclasses,
 * providing superclass identity information. (Note the ODS/API allows only a single level of subclassing.)
 */
export type SuperclassInfo = {
  /**
   * This is the identity of the document, but in the form of the superclass
   * identity. This differs from the regular identity if the subclass has an identity element renamed.
   *
   * Example: EducationOrganization has educationOrganizationId as its identity.
   *          School is a subclass of EducationOrganization and has identity renamed
   *          from educationOrganizationId to schoolId.
   *          This documentIdentity will use educationOrganizationId instead of schoolId.
   */
  documentIdentity: DocumentIdentity;

  /**
   * This is the project name of the superclass.
   *
   * Example: XYZStudentProgramAssociation is created in an extension project named 'ABC',
   *          and it subclasses GeneralStudentProgramAssociation from the data standard.
   *          The project name would be 'Ed-Fi'.
   */
  projectName: string;

  /**
   * This is the resource name of the superclass.
   *
   * Example: If the entity for this mapping is School (subclass of EducationOrganization),
   *          then the resourceName would be EducationOrganization.
   */
  resourceName: string;
};

/**
 * Creates a new empty SuperclassInfo object
 */
export function newSuperclassInfo(): SuperclassInfo {
  return {
    documentIdentity: NoDocumentIdentity,
    projectName: '',
    resourceName: '',
  };
}

/**
 * Returns the id of the given DocumentInfo superclass, using the project name, resource name
 * and identity of the superclass document.
 */
export function getMeadowlarkIdForSuperclassInfo(superclassInfo: SuperclassInfo): MeadowlarkId {
  const resourceInfo: BaseResourceInfo = {
    projectName: superclassInfo.projectName,
    resourceName: superclassInfo.resourceName,
    isDescriptor: false, // Descriptors are never superclasses
  };

  return meadowlarkIdForDocumentIdentity(resourceInfo, superclassInfo.documentIdentity);
}
