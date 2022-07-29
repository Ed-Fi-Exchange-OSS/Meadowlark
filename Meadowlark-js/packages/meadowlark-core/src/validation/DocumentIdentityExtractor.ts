// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { invariant } from 'ts-invariant';
import { EntityProperty, TopLevelEntity } from '@edfi/metaed-core';
import {
  topLevelNameOnEntity,
  ReferenceComponent,
  isReferenceElement,
  EntityMeadowlarkData,
  EntityPropertyMeadowlarkData,
} from '@edfi/metaed-plugin-edfi-meadowlark';
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
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;
  const documentPathAsString: string = [...documentPath, apiMapping.fullName].join('.');
  const elementValue: string | undefined = R.path([...documentPath, apiMapping.fullName], body);

  invariant(
    elementValue != null,
    `Identity element value for ${property.metaEdName} not found in ${JSON.stringify(body)} at ${documentPathAsString}`,
  );

  return [{ name: documentPathAsString, value: elementValue }];
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
    return [singleIdentityFrom(identityReferenceComponent.sourceProperty, body, documentPath)];
  }

  const result: DocumentIdentity[] = [];
  identityReferenceComponent.referenceComponents.forEach((childComponent: ReferenceComponent) => {
    const identityTopLevelName = topLevelNameOnEntity(entity, identityReferenceComponent.sourceProperty);
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
    entity.data.meadowlark as EntityMeadowlarkData
  ).apiMapping.identityReferenceComponents.flatMap((identityReferenceComponent: ReferenceComponent) =>
    documentIdentitiesFrom(identityReferenceComponent, body, entity, []),
  );

  // Combine the individual document identities from the top level components into a single one
  const result: DocumentIdentity = documentIdentities.flat();

  // Ensure proper ordering of identity fields, by name value ascending
  result.sort((a, b) => a.name.localeCompare(b.name));

  return result;
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
  const { superclass }: NullableTopLevelEntity = (entity.data.meadowlark as EntityMeadowlarkData).apiMapping;
  if (superclass == null) return null;
  const identityRename: EntityProperty | undefined = entity.identityProperties.find((p) => p.isIdentityRename);
  if (identityRename == null) {
    return { resourceName: superclass.metaEdName, documentIdentity, projectName: superclass.namespace.projectName };
  }

  const subclassName = decapitalize(identityRename.metaEdName);
  const superclassName = decapitalize(identityRename.baseKeyName);

  const elementToSubstitute: number = documentIdentity.findIndex((element) => element.name === subclassName);
  if (elementToSubstitute === -1) {
    return { resourceName: superclass.metaEdName, documentIdentity, projectName: superclass.namespace.projectName };
  }

  // copy both DocumentIdentity and the individual DocumentElement so original is not mutated
  const superclassIdentity: DocumentIdentity = [...documentIdentity];
  superclassIdentity[elementToSubstitute] = {
    ...documentIdentity[elementToSubstitute],
    name: superclassName,
  };

  return {
    resourceName: superclass.metaEdName,
    projectName: superclass.namespace.projectName,
    documentIdentity: superclassIdentity,
  };
}
