// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentIdentity } from '../model/DocumentIdentity';
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
  const superclassIdentity: DocumentIdentity = { ...documentIdentity };

  // Replace subclassIdentityFullname with superclassIdentityFullname
  delete superclassIdentity[resourceSchema.subclassIdentityFullname];
  superclassIdentity[resourceSchema.superclassIdentityFullname] = documentIdentity[resourceSchema.subclassIdentityFullname];

  return {
    resourceName: resourceSchema.superclassResourceName,
    projectName: resourceSchema.superclassProjectName,
    documentIdentity: superclassIdentity,
  };
}
