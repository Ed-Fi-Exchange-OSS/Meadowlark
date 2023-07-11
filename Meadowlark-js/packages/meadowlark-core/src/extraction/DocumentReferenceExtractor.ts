// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { TopLevelEntity, ReferentialProperty, normalizeDescriptorSuffix } from '@edfi/metaed-core';
import {
  EntityApiSchemaData,
  EntityPropertyApiSchemaData,
  ApiPropertyMapping,
  topLevelApiNameOnEntity,
  isReferenceElement,
  ReferenceComponent,
  ReferenceGroup,
} from '@edfi/metaed-plugin-edfi-api-schema';
import { DocumentReference } from '../model/DocumentReference';
import { DocumentIdentity } from '../model/DocumentIdentity';
import { decapitalize } from '../Utility';

/**
 * A DocumentElement is a name/value pair taken from an Ed-Fi document that expresses part of
 * the document identity.
 *
 * For example in a Student document, studentUniqueId is a part of a Student
 * document's identity. { "studentUniqueId": "1" } in a specific Student document body
 * represents that part of the identity (in relational database terms, it would be part
 *  of the "natural key").
 */
type DocumentElement = {
  /**
   * A document path name and value pair.
   */
  name: string;

  /**
   * The value taken from the document body.
   */
  value: string;
};

// document paths shaped as an array for ramdajs 'path' function
// return value is arrays of document paths, grouped (with arrays) by path endings to line up with name array
function extractRawDocumentPaths(referenceGroup: ReferenceGroup, document: object): string[][][] {
  const result: string[][][] = [];
  const { apiMapping }: { apiMapping: ApiPropertyMapping } = referenceGroup.sourceProperty.data.edfiApiSchema;

  const topLevelDocumentField: string = apiMapping.topLevelName;
  const { referencedEntity } = referenceGroup.sourceProperty as ReferentialProperty;

  // pathEndings are the property names of all the scalar identity fields
  const pathEndings: string[] = (
    referencedEntity.data.edfiApiSchema as EntityApiSchemaData
  ).apiMapping.flattenedIdentityProperties.map(
    (property) => (property.identityProperty.data.edfiApiSchema as EntityPropertyApiSchemaData).apiMapping.fullName,
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
 * Recursively collects JSON document paths from sub-ReferenceComponents, which represent identities that are
 * references to other entities. In a MetaEd model, there is no limit to the number of entities that reference others
 * as a part of their identity.
 */
function documentPathsFromSubReferenceComponent(
  subReferenceComponent: ReferenceComponent,
  referenceComponentTopLevelName: string,
): string[] {
  const propertyMeadowlarkData: EntityPropertyApiSchemaData = subReferenceComponent.sourceProperty.data.edfiApiSchema;

  if (isReferenceElement(subReferenceComponent)) {
    return [`${referenceComponentTopLevelName}.${propertyMeadowlarkData.apiMapping.fullName}`];
  }

  const result: string[] = [];
  (subReferenceComponent as ReferenceGroup).referenceComponents.forEach((childSubReferenceComponent: ReferenceComponent) => {
    result.push(...documentPathsFromSubReferenceComponent(childSubReferenceComponent, referenceComponentTopLevelName));
  });

  return result;
}

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
      if (referenceComponent.sourceProperty.type === 'schoolYearEnumeration') {
        const { roleName } = referenceComponent.sourceProperty;
        if (roleName !== '') {
          result.push(`${decapitalize(roleName)}SchoolYearTypeReference.schoolYear`);
        } else {
          result.push('schoolYearTypeReference.schoolYear');
        }
      } else {
        const propertyMeadowlarkData: EntityPropertyApiSchemaData = referenceComponent.sourceProperty.data.edfiApiSchema;
        result.push(propertyMeadowlarkData.apiMapping.fullName);
      }
    } else {
      const referenceComponentTopLevelName = topLevelApiNameOnEntity(entity, referenceComponent.sourceProperty);
      result.push(...documentPathsFromSubReferenceComponent(referenceComponent, referenceComponentTopLevelName));
    }
  });

  return result;
}

/**
 * Collapses an array of DocumentElement objects into a single DocumentIdentity.
 */
function documentIdentityFrom(documentElements: DocumentElement[]): DocumentIdentity {
  return documentElements.reduce((accumulator: DocumentIdentity, current: DocumentElement) => {
    accumulator[current.name] = current.value;
    return accumulator;
  }, {});
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

  const documentIdentitiesAsElements: DocumentElement[][] = multiZip(...orderedAndGroupedByEnding);
  // example result for documentIdentitiesAsElements after multiZip():
  // [
  //   [{name: 'classPeriodName', value: 'z1'}, {name: 'schoolId', value: '24'}, {name: 'studentId', value: '333'}],
  //   [{name: 'classPeriodName', value: 'z2'}, {name: 'schoolId', value: '25'}, {name: 'studentId', value: '444'}],
  // ]

  const documentIdentities: DocumentIdentity[] = documentIdentitiesAsElements.map((documentElements: DocumentElement[]) =>
    documentIdentityFrom(documentElements),
  );
  // example result for documentIdentities after map() using documentIdentityFrom():
  // [
  //   { classPeriodName: 'z1', schoolId: '24', studentId: '333'},
  //   { classPeriodName: 'z2', schoolId: '25', studentId: '444'},
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

  documentIdentities.forEach((documentIdentity) => {
    let resourceName = referenceGroup.sourceProperty.metaEdName;
    if (referenceGroup.sourceProperty.type === 'descriptor') {
      resourceName = normalizeDescriptorSuffix(resourceName);
    }

    result.push({
      projectName: referenceGroup.sourceProperty.namespace.projectName,
      resourceName,
      documentIdentity,
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

  (entity.data.edfiApiSchema as EntityApiSchemaData).apiMapping.referenceGroups.forEach((referenceGroup: ReferenceGroup) => {
    result.push(...documentReferencesFromReferenceGroup(referenceGroup, document, entity));
  });
  return result;
}
