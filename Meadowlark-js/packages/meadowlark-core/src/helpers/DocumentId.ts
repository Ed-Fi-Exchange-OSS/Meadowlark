// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import JsSha from 'jssha';
import invariant from 'invariant';
import { DocumentInfo } from '../model/DocumentInfo';

/**
 * Returns a SHAKE128 hash of length 224 bits for the given naturalKeyString for use as a document id.
 * naturalKeyString must be of the form "NK#<hash-separated key-value pairs>"
 */
export function documentIdFromNaturalKeyString(naturalKeyString: string): string {
  invariant(naturalKeyString.startsWith('NK#'), `naturalKeyString "${naturalKeyString}" did not start with "NK#"`);
  // Hack that might be better addressed elsewhere
  const nks = naturalKeyString.replace(/\.school=/g, '.schoolId=');

  const shaObj = new JsSha('CSHAKE128', 'TEXT');
  shaObj.update(nks);
  return shaObj.getHash('HEX', { outputLen: 224 });
}

/**
 * Returns a SHAKE128 hash of length 224 bits for the given documentInfo for use as a document id.
 * If the given documentInfo is assignable, uses that information for the document id.
 */
export function documentIdForEntityInfo(documentInfo: DocumentInfo): string {
  // If this is an assignable entity, use the assignableNaturalKey for the id instead of the actual natural key
  const naturalKey =
    documentInfo.assignableInfo == null ? documentInfo.naturalKey : documentInfo.assignableInfo.assignableNaturalKey;

  return documentIdFromNaturalKeyString(naturalKey);
}

/**
 * Document Ids are 56 character (224 bit) hex strings.
 * Example valid id: 6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7
 */
export function isDocumentIdValid(documentId: string | undefined): boolean {
  if (documentId == null) return false;
  return /[0-9A-Fa-f]{56}/g.test(documentId);
}
