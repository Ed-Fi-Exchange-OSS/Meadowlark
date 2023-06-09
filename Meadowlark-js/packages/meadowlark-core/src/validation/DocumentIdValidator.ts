// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MeadowlarkId } from '../model/BrandedTypes';
import { resourceInfoHashFrom } from '../model/DocumentIdentity';
import type { BaseResourceInfo } from '../model/ResourceInfo';

/**
 * Meadowlark Ids are 38 character Base64Url strings. No whitespace, plus or slash allowed
 * Example valid id: 02pe_9hl1wM_jO1vdx8w7iqmhPdEsFofglvS4g
 */
export function isDocumentUuidWellFormed(documentUuid: string): boolean {
  const regex = /^[a-z,0-9,-]{36,36}$/;
  return regex.test(documentUuid);
}

/**
 * Meadowlark Ids are 38 character Base64Url strings. No whitespace, plus or slash allowed
 * Example valid id: 02pe_9hl1wM_jO1vdx8w7iqmhPdEsFofglvS4g
 */
export function isMeadowlarkIdWellFormed(meadowlarkId: string): boolean {
  return /^[^\s/+]{38}$/g.test(meadowlarkId);
}

/**
 * Returns true if resource info hash matches resource info portion of meadowlark id
 */
export function isMeadowlarkIdValidForResource(meadowlarkId: MeadowlarkId, resourceInfo: BaseResourceInfo): boolean {
  return meadowlarkId.startsWith(resourceInfoHashFrom(resourceInfo));
}
