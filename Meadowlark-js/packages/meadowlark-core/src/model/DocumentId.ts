// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { normalizeDescriptorSuffix } from '@edfi/metaed-core';
import { createHash } from 'node:crypto';
import type { Hash } from 'node:crypto';
import { DocumentElement } from './DocumentElement';
import { DocumentIdentity } from './DocumentIdentity';
import { DocumentInfo } from './DocumentInfo';
import { DocumentReference } from './DocumentReference';
import { ResourceInfo } from './ResourceInfo';

/**
 * Converts Base64 to Base64Url by character replacement and truncation of padding.
 * '+' becomes '-', '/' becomes '_', and any trailing '=' are removed.
 * See https://datatracker.ietf.org/doc/html/rfc4648#section-5
 */
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Returns a SHA-224 hash for the given document identity (possibly assignable-adjusted)
 * for use as a document id.
 */
export function documentIdForDocumentIdentity(
  { projectName, resourceName, isDescriptor }: ResourceInfo,
  documentIdentity: DocumentIdentity,
): string {
  // TODO: This needs to be investigated (see RND-234) Might be due to a problem with extracted document reference paths.
  // const nks = documentIdentity.replace(/\.school=/g, '.schoolId=');

  const normalizedResourceName = isDescriptor ? normalizeDescriptorSuffix(resourceName) : resourceName;
  const stringifiedIdentity: string = `${projectName}#${normalizedResourceName}#${documentIdentity
    .map((element: DocumentElement) => `${element.name}=${element.value}`)
    .join('#')}`;

  const shaObj: Hash = createHash('sha3-224');
  shaObj.update(stringifiedIdentity);
  return toBase64Url(shaObj.digest('base64'));
}

/**
 * Returns the id of the given DocumentInfo, using the project name, resource name, resource version
 * and identity of the API document.
 * If the given documentInfo is assignable, uses that information for the document id.
 */
export function documentIdForDocumentInfo(resourceInfo: ResourceInfo, documentInfo: DocumentInfo): string {
  // If this is an assignable entity, use the assignableIdentity for the id instead of the actual document identity
  const documentIdentity: DocumentIdentity =
    documentInfo.assignableInfo == null ? documentInfo.documentIdentity : documentInfo.assignableInfo.assignableIdentity;

  return documentIdForDocumentIdentity(resourceInfo, documentIdentity);
}

/**
 * Returns the id of the given DocumentReference, using the project name, resource name, resource version
 * and identity of the API document.
 */
export function documentIdForDocumentReference(documentReference: DocumentReference): string {
  return documentIdForDocumentIdentity(
    {
      projectName: documentReference.projectName,
      resourceName: documentReference.resourceName,
      resourceVersion: documentReference.resourceVersion,
      isDescriptor: documentReference.isDescriptor,
    },
    documentReference.documentIdentity,
  );
}

/**
 * Document Ids are 38 character base64url strings. No whitespace, plus or slash allowed
 * Example valid id: t4JWTsagjhY4Ea-oIcXCeS7oqbNX9iWfPx6e-g
 */
export function isDocumentIdValid(documentId: string): boolean {
  return /^[^\s/+]{38}$/g.test(documentId);
}
