// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { normalizeDescriptorSuffix } from '@edfi/metaed-core';
import JsSha from 'jssha';
import { DocumentElement } from './DocumentElement';
import { DocumentIdentity } from './DocumentIdentity';
import { DocumentInfo } from './DocumentInfo';
import { DocumentReference } from './DocumentReference';
import { ResourceInfo } from './ResourceInfo';

/**
 * Returns a SHAKE128 hash of length 224 bits for the given document identity (possibly assignable-adjusted)
 * for use as a document id.
 */
export function documentIdForDocumentIdentity(
  { projectName, resourceName, resourceVersion, isDescriptor }: ResourceInfo,
  documentIdentity: DocumentIdentity,
): string {
  // TODO: This needs to be investigated (see RND-234) Might be due to a problem with extracted document reference paths.
  // const nks = documentIdentity.replace(/\.school=/g, '.schoolId=');

  const normalizedResourceName = isDescriptor ? normalizeDescriptorSuffix(resourceName) : resourceName;
  const stringifiedIdentity: string = `${projectName}#${normalizedResourceName}#${resourceVersion}#${documentIdentity
    .map((element: DocumentElement) => `${element.name}=${element.value}`)
    .join('#')}`;

  const shaObj = new JsSha('CSHAKE128', 'TEXT');
  shaObj.update(stringifiedIdentity);
  return shaObj.getHash('HEX', { outputLen: 224 });
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
 * Document Ids are 56 character (224 bit) hex strings.
 * Example valid id: 6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7
 */
export function isDocumentIdValid(documentId: string | undefined): boolean {
  if (documentId == null) return false;
  return /[0-9A-Fa-f]{56}/g.test(documentId);
}
