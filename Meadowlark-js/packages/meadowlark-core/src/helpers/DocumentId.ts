// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import JsSha from 'jssha';
import { DocumentElement } from '../model/DocumentElement';
import { DocumentIdentity } from '../model/DocumentIdentity';
import { DocumentInfo } from '../model/DocumentInfo';

/**
 * Returns a SHAKE128 hash of length 224 bits for the given naturalKeyString for use as a document id.
 */
export function idFromDocumentElements(documentIdentity: DocumentIdentity): string {
  // TODO: This needs to be investigated (see RND-234) Might be due to a problem with extracted document reference paths.
  // const nks = documentIdentity.replace(/\.school=/g, '.schoolId=');

  const stringifiedIdentity: string = documentIdentity
    .map((element: DocumentElement) => `${element.name}=${element.value}`)
    .join('#');

  const shaObj = new JsSha('CSHAKE128', 'TEXT');
  shaObj.update(stringifiedIdentity);
  return shaObj.getHash('HEX', { outputLen: 224 });
}

/**
 * Returns a SHAKE128 hash of length 224 bits for the given documentInfo for use as a document id.
 * If the given documentInfo is assignable, uses that information for the document id.
 */
export function documentIdForEntityInfo(documentInfo: DocumentInfo): string {
  // If this is an assignable entity, use the assignableNaturalKey for the id instead of the actual natural key
  const documentIdentity: DocumentIdentity =
    documentInfo.assignableInfo == null ? documentInfo.documentIdentity : documentInfo.assignableInfo.assignableIdentity;

  return idFromDocumentElements(documentIdentity);
}

/**
 * Document Ids are 56 character (224 bit) hex strings.
 * Example valid id: 6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7
 */
export function isDocumentIdValid(documentId: string | undefined): boolean {
  if (documentId == null) return false;
  return /[0-9A-Fa-f]{56}/g.test(documentId);
}
