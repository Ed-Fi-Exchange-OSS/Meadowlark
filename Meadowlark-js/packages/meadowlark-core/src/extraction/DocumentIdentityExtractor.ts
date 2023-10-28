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
 * An intermediate object containing the individual DocumentPaths for each property
 * that is part of the identity for this resource. Any duplicate path DocumentObjectKeys
 * will overwrite another, but this should be fine because a prior Equality Constraint
 * check will enforce that the document values are equal regardless of the path that wins.
 *
 * For example, a document may have two schoolId entries in different locations as part of
 * the document identity. Both must be the same value.
 */
type IdentityDocumentPaths = { [key: DocumentObjectKey]: JsonPath };

/**
 * Takes a MetaEd entity object and a API JSON body for the resource mapped to that MetaEd entity and
 * extracts the document identity information from the JSON body. Also extracts security information, if any.
 */
export function extractDocumentIdentity(resourceSchema: ResourceSchema, documentBody: object): DocumentIdentity {
  if (resourceSchema.isDescriptor) return descriptorDocumentIdentityFrom(documentBody as DescriptorDocument);
  if (resourceSchema.isSchoolYearEnumeration) {
    return schoolYearEnumerationDocumentIdentityFrom(documentBody as SchoolYearEnumerationDocument);
  }

  const identityDocumentPaths: IdentityDocumentPaths = {};
  resourceSchema.identityFullnames.forEach((identityFullName: MetaEdPropertyFullName) => {
    const identityPaths: DocumentPaths = resourceSchema.documentPathsMapping[identityFullName];
    Object.entries(identityPaths.paths).forEach(([documentKey, documentJsonPath]) => {
      identityDocumentPaths[documentKey] = documentJsonPath;
    });
  });

  const documentIdentity: DocumentIdentity = [];
  // Build up documentIdentity in order
  resourceSchema.identityPathOrder.forEach((documentKey: DocumentObjectKey) => {
    const documentJsonPath: JsonPath = identityDocumentPaths[documentKey];
    const documentValue: any = jsonPath({
      path: documentJsonPath,
      json: documentBody,
      wrap: false,
    });

    invariant(
      !Array.isArray(documentValue),
      `Identity for path ${documentJsonPath} should not be multiple values but was ${documentValue}`,
    );
    invariant(documentValue != null, `Identity for path ${documentJsonPath} was not found in the document`);

    documentIdentity.push({ [documentKey]: documentValue });
  });

  invariant(
    documentIdentity.length > 0,
    `DocumentIdentityExtractor: Document identity is empty for ${resourceSchema.resourceName}`,
  );

  return documentIdentity;
}
