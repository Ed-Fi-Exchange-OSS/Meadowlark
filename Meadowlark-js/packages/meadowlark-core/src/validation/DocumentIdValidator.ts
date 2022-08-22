// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { resourceInfoHashFrom } from '../model/DocumentIdentity';
import type { BaseResourceInfo } from '../model/ResourceInfo';

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
