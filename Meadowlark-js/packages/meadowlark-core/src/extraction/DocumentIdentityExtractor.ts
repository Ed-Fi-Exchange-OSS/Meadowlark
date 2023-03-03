// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { invariant } from 'ts-invariant';
import { EntityProperty, TopLevelEntity } from '@edfi/metaed-core';
import {
  topLevelApiNameOnEntity,
  ReferenceComponent,
  isReferenceElement,
  EntityApiSchemaData,
  EntityPropertyApiSchemaData,
} from '@edfi/metaed-plugin-edfi-api-schema';
import { decapitalize } from '../Utility';
import { SuperclassInfo } from '../model/SuperclassInfo';
import { DocumentIdentity } from '../model/DocumentIdentity';
import { DescriptorDocument } from '../model/DescriptorDocument';
import { descriptorDocumentIdentityFrom } from '../model/DescriptorDocumentInfo';
import { SchoolYearEnumerationDocument } from '../model/SchoolYearEnumerationDocument';
import { schoolYearEnumerationDocumentIdentityFrom } from '../model/SchoolYearEnumerationDocumentInfo';

type NullableTopLevelEntity = { superclass: TopLevelEntity | null };

/**
 * Takes a non-reference property representing a portion of the identity of a MetaEd entity,
 * an API JSON body matching that entity, and a path to the location of the property value
 * in the JSON body, and returns that portion of the document identity extracted from the JSON body.
 *
 * documentPath is a path in the JSON body as a string array with one path segment per array element.
 */
function singleIdentityFrom(property: EntityProperty, body: object, documentPath: string[]): DocumentIdentity {
  const { apiMapping } = property.data.edfiApiSchema as EntityPropertyApiSchemaData;

  let path: string[];

  if (property.type === 'schoolYearEnumeration' && property.roleName !== '') {
    path = [...documentPath, 'schoolYear'];
  } else {
    path = [...documentPath, apiMapping.fullName];
  }

  const documentPathAsString: string = path.join('.');

  const elementValue: string | undefined = R.path(path, body);

  invariant(
    elementValue != null,
    `Identity element value for ${property.metaEdName} not found in ${JSON.stringify(body)} at ${documentPathAsString}`,
  );

  return { [documentPathAsString]: elementValue };
}

/**
 * Takes a ReferenceComponent representing an identity of a MetaEd entity along with
 * an API JSON body matching that entity and returns the document identity extracted
 * from the JSON body.
 *
 * documentPath is an accumulator allowing this function to recursively build up paths in the
 * JSON body as a string array with one path segment per array element. This allows use
 * of the path() function of the ramdajs library (https://ramdajs.com/docs/#path) to extract
 * values from the JSON body.
 */
function documentIdentitiesFrom(
  identityReferenceComponent: ReferenceComponent,
  body: object,
  entity: TopLevelEntity,
  documentPath: string[],
): DocumentIdentity[] {
  if (isReferenceElement(identityReferenceComponent)) {
    // SchoolYearEnumerations are an API one-off expressed as two levels in the document body
    if (identityReferenceComponent.sourceProperty.type === 'schoolYearEnumeration') {
      const { roleName } = identityReferenceComponent.sourceProperty;
      if (roleName !== '') {
        documentPath.push(`${decapitalize(roleName)}SchoolYearTypeReference`);
      } else {
        documentPath.push('schoolYearTypeReference');
      }
    }
    return [singleIdentityFrom(identityReferenceComponent.sourceProperty, body, documentPath)];
  }

  const result: DocumentIdentity[] = [];
  identityReferenceComponent.referenceComponents.forEach((childComponent: ReferenceComponent) => {
    const identityTopLevelName = topLevelApiNameOnEntity(entity, identityReferenceComponent.sourceProperty);
    const newDocumentPath: string[] = documentPath.length > 0 ? documentPath : [identityTopLevelName];
    if (isReferenceElement(childComponent)) {
      result.push(singleIdentityFrom(childComponent.sourceProperty, body, newDocumentPath));
    } else {
      result.push(...documentIdentitiesFrom(childComponent, body, entity, newDocumentPath));
    }
  });
  return result;
}

/**
 * Collapses an array of DocumentIdentity objects into a single DocumentIdentity.
 */
function documentIdentityFrom(documentIdentities: DocumentIdentity[]): DocumentIdentity {
  return documentIdentities.reduce(
    (accumulator: DocumentIdentity, current: DocumentIdentity) => ({ ...accumulator, ...current }),
    {},
  );
}

/**
 * Takes a MetaEd entity object and a API JSON body for the resource mapped to that MetaEd entity and
 * extracts the document identity information from the JSON body. Also extracts security information, if any.
 */
export function extractDocumentIdentity(entity: TopLevelEntity, body: object): DocumentIdentity {
  if (entity.type === 'descriptor') return descriptorDocumentIdentityFrom(body as DescriptorDocument);
  if (entity.type === 'schoolYearEnumeration')
    return schoolYearEnumerationDocumentIdentityFrom(body as SchoolYearEnumerationDocument);

  // identityReferenceComponents can represent a tree of identity information, thus the need to
  // flatmap into identities per top level component.
  const documentIdentities: DocumentIdentity[] = (
    entity.data.edfiApiSchema as EntityApiSchemaData
  ).apiMapping.identityReferenceComponents.flatMap((identityReferenceComponent: ReferenceComponent) =>
    documentIdentitiesFrom(identityReferenceComponent, body, entity, []),
  );

  // Combine the individual document identities from the top level components into a single one
  return documentIdentityFrom(documentIdentities);
}

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
