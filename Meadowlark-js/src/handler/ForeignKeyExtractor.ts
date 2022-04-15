// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { TopLevelEntity, ReferentialProperty } from '@edfi/metaed-core';
import { isReferenceElement, ReferenceComponent, ReferenceGroup } from '../metaed/model/ReferenceComponent';
import { ApiPropertyMapping } from '../metaed/model/ApiPropertyMapping';
import { ReferentialConstraint } from '../model/ReferentialConstraint';
import { deriveAssignableFrom } from './NaturalKeyExtractor';
import { AssignableInfo } from '../model/AssignableInfo';
import { EntityMeadowlarkData } from '../metaed/model/EntityMeadowlarkData';
import { EntityPropertyMeadowlarkData } from '../metaed/model/EntityPropertyMeadowlarkData';
import { topLevelNameOnEntity } from '../metaed/Utility';

// body paths shaped as an array for ramdajs 'path' function
// return value is arrays of body paths, grouped (with arrays) by path endings to line up with namePath array
function extractBodyPaths(referenceGroup: ReferenceGroup, body: object): string[][][] {
  const result: string[][][] = [];
  const { apiMapping }: { apiMapping: ApiPropertyMapping } = referenceGroup.sourceProperty.data.meadowlark;

  const topLevelBodyField: string = apiMapping.topLevelName;
  const { referencedEntity } = referenceGroup.sourceProperty as ReferentialProperty;

  // pathEndings are the property names of all the scalar identity fields
  const pathEndings: string[] = (
    referencedEntity.data.meadowlark as EntityMeadowlarkData
  ).apiMapping.flattenedIdentityProperties.map(
    (property) => (property.data.meadowlark as EntityPropertyMeadowlarkData).apiMapping.fullName,
  );

  if (apiMapping.isReferenceCollection) {
    // pathEndings line up with ReferenceGroup documentBodyPaths
    pathEndings.forEach((pathEnding: string) => {
      const pathEndingResult: string[][] = [];
      // check for omitted optional collection
      if (body[topLevelBodyField] != null) {
        // use the body just to get the count of references in the collection
        body[topLevelBodyField].forEach((_collectionObject, index) => {
          pathEndingResult.push([topLevelBodyField, index, apiMapping.referenceCollectionName, pathEnding]);
          // example individual pathEndingResult entry, which is a path to a single value in the body to be extracted:
          // ['classPeriods', 0, 'classPeriodReference', 'schoolId']
        });
      }
      // example pathEndingResult, multiple paths to same value, differing by array element in the body:
      // [
      //   ['classPeriods', 0, 'classPeriodReference', 'schoolId'],
      //   ['classPeriods', 1, 'classPeriodReference', 'schoolId']
      // ]
      result.push(pathEndingResult);
    });
  } else {
    // apiMapping is not a collection
    pathEndings.forEach((pathEnding) => {
      // check for omitted optional reference
      if (R.path([topLevelBodyField, pathEnding], body) != null) {
        result.push([[topLevelBodyField, pathEnding]]);
      }
    });
  }

  return result;
}

/**
 * Zip an arbitrary number of arrays.  Used to transpose arrays of extractions of the same path endpoint from
 * multiple locations (such as the repetition of values in a collection in an API body) into foreign key bundles.
 */
const multiZip = (...theArrays) => {
  const [firstArray, ...restArrays] = theArrays;
  return firstArray.map((value, index) => restArrays.reduce((acc, array) => [...acc, array[index]], [value]));
};

type ExtractedValue = {
  namePath: string;
  bodyValue: string;
};

/**
 * Takes the list of ReferenceComponents in a ReferenceGroup and the specific entity this is on, and returns a list
 * of dot-separated JSON body paths for each ReferenceComponent.
 *
 * Note that a ReferenceComponent can resolve to multiple body paths.
 */
function extractDocumentBodyPaths(referenceComponents: ReferenceComponent[], entity: TopLevelEntity): string[] {
  const result: string[] = [];
  referenceComponents.forEach((referenceComponent) => {
    if (isReferenceElement(referenceComponent)) {
      const propertyMeadowlarkData: EntityPropertyMeadowlarkData = referenceComponent.sourceProperty.data.meadowlark;
      result.push(propertyMeadowlarkData.apiMapping.fullName);
    } else {
      referenceComponent.referenceComponents.forEach((childReferenceComponent) => {
        const childPropertyMeadowlarkData: EntityPropertyMeadowlarkData =
          childReferenceComponent.sourceProperty.data.meadowlark;

        const referenceComponentTopLevelName = topLevelNameOnEntity(entity, referenceComponent.sourceProperty);
        // assuming only two levels, meaning child is always a ReferenceElement
        result.push(`${referenceComponentTopLevelName}.${childPropertyMeadowlarkData.apiMapping.fullName}`);
      });
    }
  });
  return result;
}

/**
 * Takes a ReferenceGroup representing a reference on a MetaEd entity, along with
 * an API JSON body matching that entity, and returns an array of foreign key bundles
 * for all of the portions of the reference.
 *
 * Example of a foreign key bundle, representing a collection of two references to the same entity type
 * [
 *   ['classPeriodName=z1', 'schoolId=24', 'studentId=333'],
 *   ['classPeriodName=z2', 'schoolId=25', 'studentId=444']
 * ]
 */
function foreignKeyBundlesFromReferenceGroup(
  referenceGroup: ReferenceGroup,
  body: object,
  entity: TopLevelEntity,
): ExtractedValue[][] {
  // The body paths of the reference group, which matches the API document body paths to the
  // foreign key elements of the entity being referenced.
  const documentBodyPaths: string[] = extractDocumentBodyPaths(referenceGroup.referenceComponents, entity);

  const bodyPathSets: string[][][] = extractBodyPaths(referenceGroup, body);
  // if lengths are different, something optional was not present, so we are done
  if (documentBodyPaths.length !== bodyPathSets.length) return [];

  const orderedAndGroupedByEnding: ExtractedValue[][] = R.zipWith(
    (namePath: string, bodyPathSet: string[][]) =>
      bodyPathSet.map((bodyPath) => ({ namePath, bodyValue: R.path(bodyPath, body) as string })),
    documentBodyPaths,
    bodyPathSets,
  );
  // example result for orderedAndGroupedByEnding after R.zipWith():
  // [
  //   [{namePath: 'classPeriodName', value: 'z1'}, {namePath: 'classPeriodName', value: 'z2'}],
  //   [{namePath: 'schoolId', value: '24'}, {namePath: 'schoolId', value: '25'}],
  //   [{namePath: 'studentId', value: '333'}, {namePath: 'studentId', value: '444'}]
  // ]

  if (orderedAndGroupedByEnding.length === 0) return [];

  const foreignKeyBundles: ExtractedValue[][] = multiZip(...orderedAndGroupedByEnding);
  // example result for foreignKeyBundles after multiZip():
  // [
  //   [{namePath: 'classPeriodName', value: 'z1'}, {namePath: 'schoolId', value: '24'}, {namePath: 'studentId', value: '333'}],
  //   [{namePath: 'classPeriodName', value: 'z2'}, {namePath: 'schoolId', value: '25'}, {namePath: 'studentId', value: '444'}],
  // ]

  return foreignKeyBundles;
}

/**
 * Converts bundle to string in natual key form
 * For example, converts:
 * [{namePath: 'classPeriodName', value: 'z1'}, {namePath: 'schoolId', value: '24'}, {namePath: 'studentId', value: '333'}]
 * to 'NK#classPeriodName=z1#schoolId=24#studentId=333'
 */
function foreignKeyBundleToString(foreignKeyBundle: ExtractedValue[]): string {
  const stringifiedValues: string[] = foreignKeyBundle.map((value) => `${value.namePath}=${value.bodyValue}`);
  return `NK#${stringifiedValues.join('#')}`;
}

/**
 * Takes a ReferenceGroup representing a reference on a MetaEd entity, along with
 * an API JSON body matching that entity, and returns an array of foreign key constraints
 * for all of the portions of the reference.
 */
function foreignKeysFromReferenceGroup(
  referenceGroup: ReferenceGroup,
  body: object,
  entity: TopLevelEntity,
): ReferentialConstraint[] {
  const foreignKeyBundles: ExtractedValue[][] = foreignKeyBundlesFromReferenceGroup(referenceGroup, body, entity);
  // Example of a foreign key bundle, representing a collection of two references to the same entity type
  // [
  //   [{namePath: 'classPeriodName', value: 'z1'}, {namePath: 'schoolId', value: '24'}, {namePath: 'studentId', value: '333'}],
  //   [{namePath: 'classPeriodName', value: 'z2'}, {namePath: 'schoolId', value: '25'}, {namePath: 'studentId', value: '444'}],
  // ]

  const result: ReferentialConstraint[] = [];

  const { referencedEntity } = referenceGroup.sourceProperty as ReferentialProperty;
  foreignKeyBundles.forEach((bundle) => {
    const foreignKey: string = foreignKeyBundleToString(bundle);
    // Check if this reference is to an assignable entity. If so, the foreign key string is in superclass form
    const assignableInfo: AssignableInfo | null = deriveAssignableFrom(referencedEntity, foreignKey);

    result.push({
      metaEdType: referenceGroup.sourceProperty.type,
      metaEdName: referenceGroup.sourceProperty.metaEdName,
      constraintKey: assignableInfo == null ? foreignKey : assignableInfo.assignableNaturalKey,
      isAssignableFrom: referencedEntity.subclassedBy.length > 0,
    });
  });
  return result;
}

/**
 * Takes a MetaEd entity object and a API JSON body for the resource mapped to that MetaEd entity and
 * extracts the foreign key (reference) information from the JSON body, in the same form as a
 * natural key: NK#<path1>=<value1>#<path2>=<value2>#<path3>=<value3>#...
 */
export function extractForeignKeys(entity: TopLevelEntity, body: object): ReferentialConstraint[] {
  const result: ReferentialConstraint[] = [];

  (entity.data.meadowlark as EntityMeadowlarkData).apiMapping.referenceGroups.forEach((referenceGroup: ReferenceGroup) => {
    result.push(...foreignKeysFromReferenceGroup(referenceGroup, body, entity));
  });
  return result;
}
