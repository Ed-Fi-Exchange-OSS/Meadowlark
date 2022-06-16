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
import { Assignable } from '../model/Assignable';
import { DocumentIdentity, NoDocumentIdentity } from '../model/DocumentIdentity';
import { DescriptorDocument } from '../model/DescriptorDocument';
import { descriptorDocumentIdentityFrom } from '../model/DescriptorDocumentInfo';

type NullableTopLevelEntity = { assignableTo: TopLevelEntity | null };

/**
 * The identity of a document, along with security information
 */
export type DocumentIdentityWithSecurity = {
  /**
   * The identity of a document
   */
  documentIdentity: DocumentIdentity;
  /**
   * The student id value in the document, or null if one does not exist
   */
  studentId: string | null;
  /**
   * The education organization id value in the document, or null if one does not exist
   */

  edOrgId: string | null;
};

/**
 * Takes a non-reference property representing a portion of the identity of a MetaEd entity,
 * an API JSON body matching that entity, and a path to the location of the property value
 * in the JSON body, and returns that portion of the document identity extracted from the JSON body.
 *
 * documentPath is a path in the JSON body as a string array with one path segment per array element.
 */
function singleIdentityFrom(property: EntityProperty, body: object, documentPath: string[]): DocumentIdentityWithSecurity {
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;
  const documentPathAsString: string = [...documentPath, apiMapping.fullName].join('.');
  const elementValue: string | undefined = R.path([...documentPath, apiMapping.fullName], body);

  invariant(
    elementValue != null,
    `Identity element value for ${property.metaEdName} not found in ${JSON.stringify(body)} at ${documentPathAsString}`,
  );

  return {
    documentIdentity: [{ name: documentPathAsString, value: elementValue }],
    studentId: apiMapping.fullName === 'studentUniqueId' ? elementValue : null,
    edOrgId: ['schoolId', 'educationOrganizationId'].includes(apiMapping.fullName) ? elementValue : null,
  };
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
): DocumentIdentityWithSecurity[] {
  if (isReferenceElement(identityReferenceComponent)) {
    return [singleIdentityFrom(identityReferenceComponent.sourceProperty, body, documentPath)];
  }

  const result: DocumentIdentityWithSecurity[] = [];
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
 * All descriptor documents have the same identity fields
 */
function descriptorDocumentIdentityWithSecurity(body: DescriptorDocument): DocumentIdentityWithSecurity {
  return { documentIdentity: descriptorDocumentIdentityFrom(body), studentId: null, edOrgId: null };
}

/**
 * Takes a MetaEd entity object and a API JSON body for the resource mapped to that MetaEd entity and
 * extracts the document identity information from the JSON body. Also extracts security information, if any.
 */
export function extractDocumentIdentity(entity: TopLevelEntity, body: object): DocumentIdentityWithSecurity {
  if (entity.type === 'descriptor') return descriptorDocumentIdentityWithSecurity(body as DescriptorDocument);

  const documentIdentitiesWithSecurity: DocumentIdentityWithSecurity[] = (
    entity.data.meadowlark as EntityMeadowlarkData
  ).apiMapping.identityReferenceComponents.flatMap((identityReferenceComponent: ReferenceComponent) =>
    documentIdentitiesFrom(identityReferenceComponent, body, entity, []),
  );

  return documentIdentitiesWithSecurity.reduce(
    (acc: DocumentIdentityWithSecurity, current: DocumentIdentityWithSecurity) => {
      acc.documentIdentity = [...acc.documentIdentity, ...current.documentIdentity];
      // Note that last non-null studentId/edOrgId wins
      if (current.studentId != null) acc.studentId = current.studentId;
      if (current.edOrgId != null) acc.edOrgId = current.edOrgId;
      return acc;
    },
    { documentIdentity: NoDocumentIdentity, studentId: null, edOrgId: null },
  );
}

/**
 * Substitute an assignableIdentity from an already constructed DocumentIdentity, if the entity should have one.
 * If the entity is a subclass with an identity rename, replace the renamed identity property with the original
 * superclass identity property name, thereby putting it in superclass form.
 *
 * For example, School is a subclass of EducationOrganization which renames educationOrganizationId
 * to schoolId. An example document identity for a School is { name: schoolId, value: 123 }. The equivalent assignable identity
 * for this School would be { name: educationOrganizationId, value: 123 }.
 *
 */
export function deriveAssignableFrom(entity: TopLevelEntity, documentIdentity: DocumentIdentity): Assignable | null {
  const { assignableTo }: NullableTopLevelEntity = (entity.data.meadowlark as EntityMeadowlarkData).apiMapping;
  if (assignableTo == null) return null;
  const identityRename: EntityProperty | undefined = entity.identityProperties.find((p) => p.isIdentityRename);
  if (identityRename == null) return { assignableToName: assignableTo.metaEdName, assignableIdentity: documentIdentity };

  const subclassName = decapitalize(identityRename.metaEdName);
  const superclassName = decapitalize(identityRename.baseKeyName);

  const elementToSubstitute: number = documentIdentity.findIndex((element) => element.name === subclassName);
  if (elementToSubstitute === -1) return { assignableToName: assignableTo.metaEdName, assignableIdentity: documentIdentity };

  // copy both DocumentIdentity and the individual DocumentElement so original is not mutated
  const identityCopy: DocumentIdentity = [...documentIdentity];
  identityCopy[elementToSubstitute] = {
    ...documentIdentity[elementToSubstitute],
    name: superclassName,
  };

  return {
    assignableToName: assignableTo.metaEdName,
    assignableIdentity: identityCopy,
  };
}
