// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import invariant from 'ts-invariant';
import { JSONPath as jsonPath } from 'jsonpath-plus';
import { DocumentReference } from '../model/DocumentReference';
import { DocumentObjectKey } from '../model/api-schema/DocumentObjectKey';
import { DocumentPaths } from '../model/api-schema/DocumentPaths';
import { ResourceSchema } from '../model/api-schema/ResourceSchema';
import { DocumentIdentity } from '../model/DocumentIdentity';

/**
 * In extracting DocumentReferences, there is an intermediate step where document values are resolved
 * from a JsonPath. JsonPaths return arrays of values when the path goes into an array.
 * This is the case for collections of document references.
 *
 * This means that each path resolves to one document value in *each* document reference in the collection.
 * For each DocumentObjectKey of a reference, IntermediateDocumentReferences holds the array of resolved document values
 * for a path.
 *
 * For example, given a document with a collection of ClassPeriod references:
 *
 * classPeriods: [
 *   {
 *     classPeriodReference: {
 *       schoolId: '24',
 *       classPeriodName: 'z1',
 *     },
 *   },
 *   {
 *     classPeriodReference: {
 *       schoolId: '25',
 *       classPeriodName: 'z2',
 *     },
 *   },
 * ]
 *
 * With JsonPaths for ClassPeriod references:
 * "* $.classPeriods[*].classPeriodReference.schoolId" for schoolId and
 * "$.classPeriods[*].classPeriodReference.classPeriodName" for classPeriodName,
 * the IntermediateDocumentReferences would be:
 *
 * {
 *   schoolId: ['24', '25'],
 *   classPeriodName: ['z1', 'z2']
 * }
 *
 * IntermediateDocumentReferences here contains information for two DocumentReferences, but as "slices" in the wrong
 * orientation.
 */
type IntermediateDocumentReferences = { [key: DocumentObjectKey]: any[] };

/**
 * Takes a resource schema and an API document for that resource and
 * extracts the document reference information from the document.
 */
export function extractDocumentReferences(resourceSchema: ResourceSchema, documentBody: object): DocumentReference[] {
  const result: DocumentReference[] = [];

  Object.values(resourceSchema.documentPathsMapping).forEach((documentPaths: DocumentPaths) => {
    // Only applies to paths to document references
    if (!documentPaths.isReference) return;

    // Only applies to non-descriptor references
    if (documentPaths.isDescriptor) return;

    // Build up intermediateDocumentReferences
    const intermediateDocumentReferences: IntermediateDocumentReferences = {};
    Object.entries(documentPaths.paths).forEach(([documentKey, documentJsonPath]) => {
      const documentValuesSlice: any[] = jsonPath({
        path: documentJsonPath,
        json: documentBody,
        flatten: true,
      });

      invariant(
        Array.isArray(documentValuesSlice),
        `JsonPath ${documentJsonPath} should have returned an array but instead was ${documentValuesSlice}`,
      );

      // Path can be empty if reference is optional
      if (documentValuesSlice.length === 0) return;

      intermediateDocumentReferences[documentKey] = documentValuesSlice;
    });

    const documentValuesSlices = Object.values(intermediateDocumentReferences);

    // Empty if reference is optional and no values
    if (documentValuesSlices.length === 0) return;

    // Number of document values from resolved JsonPaths should all be the same, otherwise something is very wrong
    invariant(
      documentValuesSlices.every(
        (documentValuesSlice) => documentValuesSlice.length === documentValuesSlices[0].length,
        `Length of document value slices are not equal`,
      ),
    );

    // Reorient intermediateDocumentReferences into actual references
    for (let index = 0; index < documentValuesSlices[0].length; index += 1) {
      const documentIdentity: DocumentIdentity = [];

      // Build the document identity in the correct path order
      documentPaths.pathOrder.forEach((documentKey: DocumentObjectKey) => {
        documentIdentity.push({ documentKey, documentValue: intermediateDocumentReferences[documentKey][index] });
      });

      result.push({
        documentIdentity,
        isDescriptor: documentPaths.isDescriptor,
        projectName: documentPaths.projectName,
        resourceName: documentPaths.resourceName,
      });
    }
  });

  return result;
}
