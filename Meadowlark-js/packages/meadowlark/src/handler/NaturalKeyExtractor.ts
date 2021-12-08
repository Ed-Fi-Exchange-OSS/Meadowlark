// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { EntityProperty, TopLevelEntity } from 'metaed-core';
import { ReferenceComponent, isReferenceElement } from '../metaed/model/ReferenceComponent';
import { topLevelNameOnEntity, uncapitalize } from '../metaed/Utility';
import { AssignableInfo } from '../model/AssignableInfo';
import { EntityMeadowlarkData } from '../metaed/model/EntityMeadowlarkData';
import { EntityPropertyMeadowlarkData } from '../metaed/model/EntityPropertyMeadowlarkData';

/**
 * The natural key of a JSON document, along with security information
 */
export type NaturalKeyWithSecurity = {
  /**
   * A natural key string for a JSON document, in the form of:
   * <path1>=<value1>#<path2>=<value2>#<path3>=<value3>#...
   */
  naturalKey: string;
  /**
   * The student id value in the JSON document, or null if one does not exist
   */
  studentId: string | null;
  /**
   * The education organization id value in the JSON document, or null if one does not exist
   */

  edOrgId: string | null;
};

/**
 * Takes a non-reference property representing a portion of the identity of a MetaEd entity,
 * an API JSON body matching that entity, and a path to the location of the property value
 * in the JSON body, and returns that portion of the natural key extracted from the JSON body.
 *
 * bodyPath is a path in the JSON body as a string array with one path segment per array element.
 */
function singleNaturalKeyFrom(property: EntityProperty, body: object, bodyPath: string[]): NaturalKeyWithSecurity {
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;
  const bodyPathAsString: string = [...bodyPath, apiMapping.fullName].join('.');
  let naturalKeyValue: string | undefined = R.path([...bodyPath, apiMapping.fullName], body);
  if (naturalKeyValue == null) naturalKeyValue = ''; // TODO: fatal error?
  return {
    naturalKey: `${bodyPathAsString}=${naturalKeyValue}`,
    studentId: apiMapping.fullName === 'studentUniqueId' ? naturalKeyValue : null,
    edOrgId: ['schoolId', 'educationOrganizationId'].includes(apiMapping.fullName) ? naturalKeyValue : null,
  };
}

/**
 * Takes a ReferenceComponent representing an identity of a MetaEd entity along with
 * an API JSON body matching that entity and returns the natural key extracted
 * from the JSON body.
 *
 * bodyPath is an accumulator allowing this function to recursively build up paths in the
 * JSON body as a string array with one path segment per array element. This allows use
 * of the path() function of the ramdajs library (https://ramdajs.com/docs/#path) to extract
 * values from the JSON body.
 */
function naturalKeysFrom(
  identityReferenceComponent: ReferenceComponent,
  body: object,
  entity: TopLevelEntity,
  bodyPath: string[],
): NaturalKeyWithSecurity[] {
  if (isReferenceElement(identityReferenceComponent)) {
    return [singleNaturalKeyFrom(identityReferenceComponent.sourceProperty, body, bodyPath)];
  }

  const result: NaturalKeyWithSecurity[] = [];
  identityReferenceComponent.referenceComponents.forEach((childComponent: ReferenceComponent) => {
    const identityTopLevelName = topLevelNameOnEntity(entity, identityReferenceComponent.sourceProperty);
    const newBodyPath: string[] = bodyPath.length > 0 ? bodyPath : [identityTopLevelName];
    if (isReferenceElement(childComponent)) {
      result.push(singleNaturalKeyFrom(childComponent.sourceProperty, body, newBodyPath));
    } else {
      result.push(...naturalKeysFrom(childComponent, body, entity, newBodyPath));
    }
  });
  return result;
}

/**
 * Takes a MetaEd entity object and a API JSON body for the resource mapped to that MetaEd entity and
 * extracts the natural key information from the JSON body. Also extracts security information, if any.
 */
export function extractNaturalKey(entity: TopLevelEntity, body: object): NaturalKeyWithSecurity {
  const naturalKeysWithSecurity: NaturalKeyWithSecurity[] = (entity.data
    .meadowlark as EntityMeadowlarkData).apiMapping.identityReferenceComponents.flatMap(
    (identityReferenceComponent: ReferenceComponent) => naturalKeysFrom(identityReferenceComponent, body, entity, []),
  );

  return naturalKeysWithSecurity.reduce(
    (acc: NaturalKeyWithSecurity, current: NaturalKeyWithSecurity) => {
      acc.naturalKey = `${acc.naturalKey}#${current.naturalKey}`;
      // Note that last non-null studentId/edOrgId wins
      if (current.studentId != null) acc.studentId = current.studentId;
      if (current.edOrgId != null) acc.edOrgId = current.edOrgId;
      return acc;
    },
    { naturalKey: 'NK', studentId: null, edOrgId: null },
  );
}

/**
 * This is a bit of a post-processing hack to substitute to create an assignableNaturalKey from an
 * already constructed natural key. If the entity should have one (see description in EntityInfo),
 * it starts as a copy of the natural key. If the entity is a subclass with an identity rename,
 * string substitution replaces the renamed identity property with the original superclass identity
 * property, thereby putting it in superclass form.
 *
 * For example, School is a subclass of EducationOrganization. School renames educationOrganizationId
 * to schoolId. An example natural key for a School is NK#schoolId=123. The equivalent assignable natural
 * key for this School would be NK#educationOrganizationId=123.
 *
 * Simple substitution can break down if there are ordering differences in natural key components,
 * however the DS has never had subclasses with multiple identity properties AND identity renames.
 *
 * TODO: Bring this behavior into extractNaturalKey, correctly managing for natural key component ordering.
 */
export function deriveAssignableFrom(entity: TopLevelEntity, naturalKey: string): AssignableInfo | null {
  const { assignableTo }: { assignableTo: TopLevelEntity | null } = (entity.data
    .meadowlark as EntityMeadowlarkData).apiMapping;
  if (assignableTo == null) return null;
  const identityRename: EntityProperty | undefined = entity.identityProperties.find((p) => p.isIdentityRename);
  if (identityRename == null) return { assignableToName: assignableTo.metaEdName, assignableNaturalKey: naturalKey };

  const renamedPropertyName = uncapitalize(identityRename.metaEdName);
  const originalName = uncapitalize(identityRename.baseKeyName);

  // Substitution regex is lookbehind for "#" and lookahead for first "=" afterward, with renamed property
  // in between. Using string concatenation to improve readability
  // eslint-disable-next-line prefer-template
  const renamedRegex = new RegExp('(?<=#)' + renamedPropertyName + '?(?=\\=)');
  return {
    assignableToName: assignableTo.metaEdName,
    assignableNaturalKey: naturalKey.replace(renamedRegex, originalName),
  };
}
