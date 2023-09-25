// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { JSONPath as jsonPath } from 'jsonpath-plus';
import { DocumentIdentity } from '../model/DocumentIdentity';
import { DocumentReference } from '../model/DocumentReference';
import { DocumentObjectKey } from '../model/api-schema/DocumentObjectKey';
import { DocumentPaths } from '../model/api-schema/DocumentPaths';
import { JsonPath } from '../model/api-schema/JsonPath';
import { ResourceSchema } from '../model/api-schema/ResourceSchema';

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

    const documentIdentity: DocumentIdentity = [];
    // Build up documentIdentity in order
    documentPaths.pathOrder.forEach((documentKey: DocumentObjectKey) => {
      const documentJsonPath: JsonPath = documentPaths.paths[documentKey];
      const documentValue: any = jsonPath({
        path: documentJsonPath,
        json: documentBody,
        flatten: true,
      });
      documentIdentity.push({ documentKey, documentValue });
    });

    result.push({
      documentIdentity,
      isDescriptor: documentPaths.isDescriptor,
      projectName: documentPaths.projectName,
      resourceName: documentPaths.resourceName,
    });
  });

  return result;
}
