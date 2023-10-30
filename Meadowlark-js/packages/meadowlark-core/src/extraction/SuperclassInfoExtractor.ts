// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import invariant from 'ts-invariant';
import { DocumentIdentity, DocumentIdentityElement } from '../model/DocumentIdentity';
import { SuperclassInfo } from '../model/SuperclassInfo';
import type { ResourceSchema } from '../model/api-schema/ResourceSchema';

/**
 * Create a SuperclassInfo from an already constructed DocumentIdentity, if the entity should have one.
 * If the entity is a subclass with an identity rename, replace the renamed identity property with the
 * original superclass identity property name, thereby putting it in superclass form.
 *
 * For example, School is a subclass of EducationOrganization which renames educationOrganizationId
 * to schoolId. An example document identity for a School is { name: schoolId, value: 123 }. The
 * equivalent superclass identity for this School would be { name: educationOrganizationId, value: 123 }.
 *
 */
export function deriveSuperclassInfoFrom(
  resourceSchema: ResourceSchema,
  documentIdentity: DocumentIdentity,
): SuperclassInfo | null {
  if (!resourceSchema.isSubclass) return null;

  // Associations do not rename the identity fields in MetaEd, so the DocumentIdentity portion is the same
  if (resourceSchema.subclassType === 'association') {
    return {
      resourceName: resourceSchema.superclassResourceName,
      projectName: resourceSchema.superclassProjectName,
      documentIdentity,
    };
  }

  // Copy the DocumentIdentity so the original is not affected
  const superclassIdentity: DocumentIdentity = [...documentIdentity];

  // Find location of element for rename
  const indexForRename = superclassIdentity.findIndex(
    (element: DocumentIdentityElement) => element[resourceSchema.subclassIdentityDocumentKey] != null,
  );
  invariant(
    indexForRename !== -1,
    `deriveSuperclassInfoFrom found no identity element with name ${resourceSchema.subclassIdentityDocumentKey}`,
  );

  // Get value for renamed element
  const valueForRename: any = superclassIdentity[indexForRename][resourceSchema.subclassIdentityDocumentKey];
  invariant(
    valueForRename != null,
    `deriveSuperclassInfoFrom found no value for ${resourceSchema.subclassIdentityDocumentKey}`,
  );

  // Create renamed element
  const renamedIdentityElement: DocumentIdentityElement = {
    [resourceSchema.superclassIdentityDocumentKey]: valueForRename,
  };

  // Overwrite renamed element (array was cloned, so this is ok)
  superclassIdentity[indexForRename] = renamedIdentityElement;

  return {
    resourceName: resourceSchema.superclassResourceName,
    projectName: resourceSchema.superclassProjectName,
    documentIdentity: superclassIdentity,
  };
}
