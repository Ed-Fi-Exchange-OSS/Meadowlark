// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { JSONPath as jsonPath } from 'jsonpath-plus';
import invariant from 'ts-invariant';
import { DocumentIdentity } from '../model/DocumentIdentity';
import { DocumentReference } from '../model/DocumentReference';
import { DocumentObjectKey } from '../model/api-schema/DocumentObjectKey';
import { DocumentPaths } from '../model/api-schema/DocumentPaths';
import { JsonPath } from '../model/api-schema/JsonPath';
import { ResourceSchema } from '../model/api-schema/ResourceSchema';

/**
 * Takes a resource schema and an API document for that resource and
 * extracts the descriptor URI for each descriptor value in the body
 */
export function extractDescriptorValues(resourceSchema: ResourceSchema, documentBody: object): DocumentReference[] {
  const result: DocumentReference[] = [];

  Object.values(resourceSchema.documentPathsMapping).forEach((documentPaths: DocumentPaths) => {
    // Only applies to paths to document references
    if (!documentPaths.isReference) return;

    // Only applies to descriptor references
    if (!documentPaths.isDescriptor) return;

    invariant(
      documentPaths.pathOrder.length === 1,
      `DescriptorValueExtractor: Descriptor reference for ${documentPaths.resourceName} must have a single path key`,
    );
    const descriptorKey: DocumentObjectKey = documentPaths.pathOrder[0];

    const descriptorJsonPath: JsonPath = documentPaths.paths[descriptorKey];

    const descriptorValues: any[] = jsonPath({
      path: descriptorJsonPath,
      json: documentBody,
      flatten: true,
    });

    // Path can be empty if descriptor reference is optional
    if (descriptorValues.length === 0) return;

    const documentIdentity: DocumentIdentity = descriptorValues.map((descriptorValue) => ({
      documentKey: 'descriptor' as DocumentObjectKey,
      documentValue: descriptorValue,
    }));

    result.push({
      documentIdentity,
      isDescriptor: documentPaths.isDescriptor,
      projectName: documentPaths.projectName,
      resourceName: documentPaths.resourceName,
    });
  });

  return result;
}
