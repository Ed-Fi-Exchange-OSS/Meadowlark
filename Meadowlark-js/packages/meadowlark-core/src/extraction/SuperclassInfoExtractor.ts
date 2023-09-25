// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

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
export function deriveSuperclassInfoFrom(entity: TopLevelEntity, documentIdentity: DocumentIdentity): SuperclassInfo | null {
  const { superclass }: NullableTopLevelEntity = (entity.data.edfiApiSchema as EntityApiSchemaData).apiMapping;
  if (superclass == null) return null;
  const identityRename: EntityProperty | undefined = entity.identityProperties.find((p) => p.isIdentityRename);
  if (identityRename == null) {
    return { resourceName: superclass.metaEdName, documentIdentity, projectName: superclass.namespace.projectName };
  }

  const subclassName = decapitalize(identityRename.metaEdName);
  const superclassName = decapitalize(identityRename.baseKeyName);

  if (documentIdentity[subclassName] == null) {
    return { resourceName: superclass.metaEdName, documentIdentity, projectName: superclass.namespace.projectName };
  }

  // copy the DocumentIdentity so the original is not affected
  const superclassIdentity: DocumentIdentity = { ...documentIdentity };

  // Replace subclassName with superclassName
  delete superclassIdentity[subclassName];
  superclassIdentity[superclassName] = documentIdentity[subclassName];

  return {
    resourceName: superclass.metaEdName,
    projectName: superclass.namespace.projectName,
    documentIdentity: superclassIdentity,
  };
}
