// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MeadowlarkId } from '../../src/model/IdTypes';
import { meadowlarkIdForDocumentIdentity, resourceInfoHashFrom } from '../../src/model/DocumentIdentity';
import { BaseResourceInfo } from '../../src/model/ResourceInfo';

/**
 * Returns true if resource info hash matches resource info portion of meadowlark id
 */
export function isMeadowlarkIdValidForResource(meadowlarkId: MeadowlarkId, resourceInfo: BaseResourceInfo): boolean {
  return meadowlarkId.startsWith(resourceInfoHashFrom(resourceInfo));
}

/**
 * Meadowlark Ids are 38 character Base64Url strings. No whitespace, plus or slash allowed
 * Example valid id: 02pe_9hl1wM_jO1vdx8w7iqmhPdEsFofglvS4g
 */
export function isMeadowlarkIdWellFormed(meadowlarkId: string): boolean {
  return /^[^\s/+]{38}$/g.test(meadowlarkId);
}

describe('given a valid id', () => {
  let id: MeadowlarkId;
  let validResourceInfo: BaseResourceInfo;

  beforeAll(async () => {
    validResourceInfo = {
      isDescriptor: false,
      projectName: 'ProjectName',
      resourceName: 'ResourceName',
    };

    const validDocumentIdentity = {
      key: 'value',
    };

    // Act
    id = meadowlarkIdForDocumentIdentity(validResourceInfo, validDocumentIdentity);
  });

  it('should be well formed', () => {
    expect(isMeadowlarkIdWellFormed(id)).toEqual(true);
  });

  it('should be valid for the provided resource info', () => {
    expect(isMeadowlarkIdValidForResource(id, validResourceInfo)).toEqual(true);
  });
});

describe('given a valid id with a mismatched resource info', () => {
  let id: MeadowlarkId;
  let mismatchedResourceInfo: BaseResourceInfo;

  beforeAll(async () => {
    const validResourceInfo: BaseResourceInfo = {
      isDescriptor: false,
      projectName: 'ProjectName',
      resourceName: 'ResourceName',
    };

    mismatchedResourceInfo = {
      isDescriptor: false,
      projectName: 'MismatchedProjectName',
      resourceName: 'MismatchedResourceName',
    };

    const validDocumentIdentity = {
      key: 'value',
    };

    // Act
    id = meadowlarkIdForDocumentIdentity(validResourceInfo, validDocumentIdentity);
  });

  it('should be well formed', () => {
    expect(isMeadowlarkIdWellFormed(id)).toEqual(true);
  });

  it('should be invalid for the mismatched resource info', () => {
    expect(isMeadowlarkIdValidForResource(id, mismatchedResourceInfo)).toEqual(false);
  });
});

describe('given an invalid id', () => {
  const invalidId: MeadowlarkId = 'NotAValidId' as MeadowlarkId;
  const mismatchedResourceInfo: BaseResourceInfo = {
    isDescriptor: false,
    projectName: 'MismatchedProjectName',
    resourceName: 'MismatchedResourceName',
  };

  it('should not be well formed', () => {
    expect(isMeadowlarkIdWellFormed(invalidId)).toEqual(false);
  });

  it('should be invalid for the mismatched resource info', () => {
    expect(isMeadowlarkIdValidForResource(invalidId, mismatchedResourceInfo)).toEqual(false);
  });
});
