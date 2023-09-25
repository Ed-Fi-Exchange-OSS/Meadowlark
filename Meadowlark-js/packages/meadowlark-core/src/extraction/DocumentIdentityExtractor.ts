// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import invariant from 'ts-invariant';
import { JSONPath as jsonPath } from 'jsonpath-plus';
import { DocumentIdentity } from '../model/DocumentIdentity';
import { DescriptorDocument } from '../model/DescriptorDocument';
import { descriptorDocumentIdentityFrom } from '../model/DescriptorDocumentInfo';
import { SchoolYearEnumerationDocument } from '../model/SchoolYearEnumerationDocument';
import { schoolYearEnumerationDocumentIdentityFrom } from '../model/SchoolYearEnumerationDocumentInfo';
import { ResourceSchema } from '../model/api-schema/ResourceSchema';
import { MetaEdPropertyFullName } from '../model/api-schema/MetaEdPropertyFullName';
import { DocumentPaths } from '../model/api-schema/DocumentPaths';
import { JsonPath } from '../model/api-schema/JsonPath';
import { DocumentObjectKey } from '../model/api-schema/DocumentObjectKey';

/**
 * Takes a MetaEd entity object and a API JSON body for the resource mapped to that MetaEd entity and
 * extracts the document identity information from the JSON body. Also extracts security information, if any.
 */
export function extractDocumentIdentity(resourceSchema: ResourceSchema, documentBody: object): DocumentIdentity {
  if (resourceSchema.isDescriptor) return descriptorDocumentIdentityFrom(documentBody as DescriptorDocument);
  if (resourceSchema.isSchoolYearEnumeration) {
    return schoolYearEnumerationDocumentIdentityFrom(documentBody as SchoolYearEnumerationDocument);
  }

  const documentIdentity: DocumentIdentity = [];
  resourceSchema.identityFullnames.forEach((identityFullName: MetaEdPropertyFullName) => {
    const identityPaths: DocumentPaths = resourceSchema.documentPathsMapping[identityFullName];

    // Build up documentIdentity in order
    identityPaths.pathOrder.forEach((documentKey: DocumentObjectKey) => {
      const documentJsonPath: JsonPath = identityPaths.paths[documentKey];
      const documentValue: any = jsonPath({
        path: documentJsonPath,
        json: documentBody,
        flatten: true,
      });
      documentIdentity.push({ documentKey, documentValue });
    });
  });

  invariant(
    documentIdentity.length > 0,
    `DocumentIdentityExtractor: Document identity is empty for ${resourceSchema.resourceName}`,
  );

  return documentIdentity;
}
