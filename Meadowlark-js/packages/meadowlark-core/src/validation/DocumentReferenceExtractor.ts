// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { TopLevelEntity, ReferentialProperty, normalizeDescriptorSuffix } from '@edfi/metaed-core';
import {
  EntityMeadowlarkData,
  EntityPropertyMeadowlarkData,
  ApiPropertyMapping,
  topLevelNameOnEntity,
  isReferenceElement,
  ReferenceComponent,
  ReferenceGroup,
} from '@edfi/metaed-plugin-edfi-meadowlark';
import { DocumentReference } from '../model/DocumentReference';
import { deriveAssignableFrom } from './DocumentIdentityExtractor';
import { Assignable } from '../model/Assignable';
import { DocumentIdentity } from '../model/DocumentIdentity';
import { DocumentElement } from '../model/DocumentElement';

// document paths shaped as an array for ramdajs 'path' function
// return value is arrays of document paths, grouped (with arrays) by path endings to line up with name array
function extractRawDocumentPaths(referenceGroup: ReferenceGroup, document: object): string[][][] {
  const result: string[][][] = [];
  const { apiMapping }: { apiMapping: ApiPropertyMapping } = referenceGroup.sourceProperty.data.meadowlark;

  const topLevelDocumentField: string = apiMapping.topLevelName;
  const { referencedEntity } = referenceGroup.sourceProperty as ReferentialProperty;

  // pathEndings are the property names of all the scalar identity fields
  const pathEndings: string[] = (
    referencedEntity.data.meadowlark as EntityMeadowlarkData
  ).apiMapping.flattenedIdentityProperties.map(
    (property) => (property.data.meadowlark as EntityPropertyMeadowlarkData).apiMapping.fullName,
  );

  if (apiMapping.isReferenceCollection) {
    // pathEndings line up with ReferenceGroup documentDocumentPaths
    pathEndings.forEach((pathEnding: string) => {
      const pathEndingResult: string[][] = [];
      // check for omitted optional collection
      if (document[topLevelDocumentField] != null) {
        // use the document just to get the count of references in the collection
        document[topLevelDocumentField].forEach((_collectionObject, index) => {
          pathEndingResult.push([topLevelDocumentField, index, apiMapping.referenceCollectionName, pathEnding]);
          // example individual pathEndingResult entry, which is a path to a single value in the document to be extracted:
          // ['classPeriods', 0, 'classPeriodReference', 'schoolId']
        });
      }
      // example pathEndingResult, multiple paths to same value, differing by array element in the document:
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
      if (R.path([topLevelDocumentField, pathEnding], document) != null) {
        result.push([[topLevelDocumentField, pathEnding]]);
      }
    });
  }

  return result;
}

/**
 * Zip an arbitrary number of arrays.  Used to transpose arrays of extractions of the same path endpoint from
 * multiple document locations (such as the repetition of values in a collection in an API document) into document identities.
 */
const multiZip = (...theArrays) => {
  const [firstArray, ...restArrays] = theArrays;
  return firstArray.map((value, index) => restArrays.reduce((acc, array) => [...acc, array[index]], [value]));
};

/**
 * Takes the list of ReferenceComponents in a ReferenceGroup and the specific entity this is on, and returns a list
 * of dot-separated JSON document paths for each ReferenceComponent.
 *
 * Note that a ReferenceComponent can resolve to multiple document paths.
 */
function documentPathsFromReferenceComponents(referenceComponents: ReferenceComponent[], entity: TopLevelEntity): string[] {
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
 * an API JSON document matching that entity, and returns a document identity
 * for each reference.
 *
 * Example of document identities, representing a collection of two references to the same entity type
 * [
 *   ['classPeriodName=z1', 'schoolId=24', 'studentId=333'],
 *   ['classPeriodName=z2', 'schoolId=25', 'studentId=444']
 * ]
 */
function documentIdentitiesFromReferenceGroup(
  referenceGroup: ReferenceGroup,
  document: object,
  entity: TopLevelEntity,
): DocumentIdentity[] {
  // The document paths of the reference group, which matches the API document paths to the
  // document identity elements of the entity being referenced.
  const documentPaths: string[] = documentPathsFromReferenceComponents(referenceGroup.referenceComponents, entity);

  const documentPathSets: string[][][] = extractRawDocumentPaths(referenceGroup, document);
  // if lengths are different, something optional was not present, so we are done
  if (documentPaths.length !== documentPathSets.length) return [];

  const orderedAndGroupedByEnding: DocumentElement[][] = R.zipWith(
    (name: string, documentPathSet: string[][]) =>
      documentPathSet.map((documentPath) => ({ name, value: R.path(documentPath, document) as string })),
    documentPaths,
    documentPathSets,
  );
  // example result for orderedAndGroupedByEnding after R.zipWith():
  // [
  //   [{name: 'classPeriodName', value: 'z1'}, {name: 'classPeriodName', value: 'z2'}],
  //   [{name: 'schoolId', value: '24'}, {name: 'schoolId', value: '25'}],
  //   [{name: 'studentId', value: '333'}, {name: 'studentId', value: '444'}]
  // ]

  if (orderedAndGroupedByEnding.length === 0) return [];

  const documentIdentities: DocumentIdentity[] = multiZip(...orderedAndGroupedByEnding);
  // example result for documentIdentities after multiZip():
  // [
  //   [{name: 'classPeriodName', value: 'z1'}, {name: 'schoolId', value: '24'}, {name: 'studentId', value: '333'}],
  //   [{name: 'classPeriodName', value: 'z2'}, {name: 'schoolId', value: '25'}, {name: 'studentId', value: '444'}],
  // ]

  return documentIdentities;
}

/**
 * Takes a ReferenceGroup representing a reference on a MetaEd entity, along with
 * an API document matching that entity, and returns an array of DocumentReferences
 * for all of the portions of the reference.
 */
function documentReferencesFromReferenceGroup(
  referenceGroup: ReferenceGroup,
  document: object,
  entity: TopLevelEntity,
): DocumentReference[] {
  const documentIdentities: DocumentIdentity[] = documentIdentitiesFromReferenceGroup(referenceGroup, document, entity);
  // Example of DocumentIdentities representing a collection of references to the same entity type
  // [
  //   [{name: 'classPeriodName', value: 'z1'}, {name: 'schoolId', value: '24'}, {name: 'studentId', value: '333'}],
  //   [{name: 'classPeriodName', value: 'z2'}, {name: 'schoolId', value: '25'}, {name: 'studentId', value: '444'}],
  // ]

  const result: DocumentReference[] = [];

  const { referencedEntity } = referenceGroup.sourceProperty as ReferentialProperty;
  documentIdentities.forEach((documentIdentity) => {
    // Check if this reference is to an assignable entity. If so, the identity to a superclass
    const assignable: Assignable | null = deriveAssignableFrom(referencedEntity, documentIdentity);

    let resourceName = referenceGroup.sourceProperty.metaEdName;
    if (referenceGroup.sourceProperty.type === 'descriptor') {
      resourceName = normalizeDescriptorSuffix(resourceName);
    }

    result.push({
      projectName: referenceGroup.sourceProperty.namespace.projectName,
      resourceName,
      resourceVersion: referenceGroup.sourceProperty.namespace.projectVersion,
      documentIdentity: assignable == null ? documentIdentity : assignable.assignableIdentity,
      isAssignableFrom: referencedEntity.subclassedBy.length > 0,
      isDescriptor: false,
    });
  });
  return result;
}

/**
 * Takes a MetaEd entity object and an API document for the resource mapped to that MetaEd entity and
 * extracts the document reference information from the document.
 */
export function extractDocumentReferences(entity: TopLevelEntity, document: object): DocumentReference[] {
  const result: DocumentReference[] = [];

  (entity.data.meadowlark as EntityMeadowlarkData).apiMapping.referenceGroups.forEach((referenceGroup: ReferenceGroup) => {
    result.push(...documentReferencesFromReferenceGroup(referenceGroup, document, entity));
  });
  return result;
}
