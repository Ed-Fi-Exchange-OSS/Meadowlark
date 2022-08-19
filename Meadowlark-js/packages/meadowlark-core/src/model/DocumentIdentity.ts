// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { normalizeDescriptorSuffix } from '@edfi/metaed-core';
import crypto from 'node:crypto';
import type { BaseResourceInfo } from './ResourceInfo';

/**
 * A DocumentIdentity is an object with key-value pairs that represents the complete identity of an Ed-Fi document.
 * In Ed-Fi documents, these are always a list of document elements from the top level of the document
 * (never nested in sub-objects, and never collections). The keys are the document path (dot-separated).
 *
 * This can be a series of key-value pairs because many documents have multiple values as part of their identity.
 */
export type DocumentIdentity = { [key: string]: string };

/**
 * The null object for DocumentIdentity
 */
export const NoDocumentIdentity: DocumentIdentity = {};

/**
 * Converts Base64 to Base64Url by character replacement and truncation of padding.
 * '+' becomes '-', '/' becomes '_', and any trailing '=' are removed.
 * See https://datatracker.ietf.org/doc/html/rfc4648#section-5
 */
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Hashes a string with the SHAKE256, returning a Base64 hash with the specified length given in bytes
 */
function toHash(data: string, lengthInBytes: number): string {
  return crypto.createHash('shake256', { outputLength: lengthInBytes }).update(data).digest('base64');
}

/**
 * Returns the 12 byte SHAKE256 hash form of a ResourceInfo.
 */
function resourceInfoHashFrom({ projectName, resourceName, isDescriptor }: BaseResourceInfo) {
  const normalizedResourceName = isDescriptor ? normalizeDescriptorSuffix(resourceName) : resourceName;
  const resourceInfoString = `${projectName}#${normalizedResourceName}`;
  return toHash(resourceInfoString, 12);
}

/**
 * Returns the 16 byte SHAKE256 hash form of a DocumentIdentity.
 */
function documentIdentityHashFrom(documentIdentity: DocumentIdentity): string {
  const documentIdentityString = Object.keys(documentIdentity)
    .sort()
    .map((key) => `${key}=${documentIdentity[key]}`)
    .join('#');
  return toHash(documentIdentityString, 16);
}

/**
 * Returns a 224-bit document id for the given document identity, as a concatenation of two Base64Url hashes.
 *
 * The first 96 bits (12 bytes) are a SHAKE256 hash of the resource info.
 * The remaining 128 bits (16 bytes) are a SHAKE256 hash of the document identity.
 *
 * The resulting Base64Url string is 38 characters long. The first 16 characters are the resource info hash and
 * the remaining 22 characters are the identity hash.
 */
export function documentIdForDocumentIdentity(resourceInfo: BaseResourceInfo, documentIdentity: DocumentIdentity): string {
  return toBase64Url(`${resourceInfoHashFrom(resourceInfo)}${documentIdentityHashFrom(documentIdentity)}`);
}

/**
 * Document Ids are 38 character Base64Url strings. No whitespace, plus or slash allowed
 * Example valid id: 02pe_9hl1wM_jO1vdx8w7iqmhPdEsFofglvS4g
 */
export function isDocumentIdWellFormed(documentId: string): boolean {
  return /^[^\s/+]{38}$/g.test(documentId);
}

/**
 * Returns true if resource info hash matches resource info portion of document id
 */
export function isDocumentIdValidForResource(documentId: string, resourceInfo: BaseResourceInfo): boolean {
  return documentId.startsWith(resourceInfoHashFrom(resourceInfo));
}
