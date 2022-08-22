// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { documentIdForDocumentIdentity } from '../../src/model/DocumentIdentity';
import { BaseResourceInfo } from '../../src/model/ResourceInfo';
import { isDocumentIdValidForResource, isDocumentIdWellFormed } from '../../src/validation/DocumentIdValidator';

describe('given a valid id', () => {
  let id: string;
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
    id = documentIdForDocumentIdentity(validResourceInfo, validDocumentIdentity);
  });

  it('should be well formed', () => {
    expect(isDocumentIdWellFormed(id)).toEqual(true);
  });

  it('should be valid for the provided resource info', () => {
    expect(isDocumentIdValidForResource(id, validResourceInfo)).toEqual(true);
  });
});

describe('given a valid id with a mismatched resource info', () => {
  let id: string;
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
    id = documentIdForDocumentIdentity(validResourceInfo, validDocumentIdentity);
  });

  it('should be well formed', () => {
    expect(isDocumentIdWellFormed(id)).toEqual(true);
  });

  it('should be invalid for the mismatched resource info', () => {
    expect(isDocumentIdValidForResource(id, mismatchedResourceInfo)).toEqual(false);
  });
});

describe('given an invalid id', () => {
  const invalidId = 'NotAValidId';
  const mismatchedResourceInfo: BaseResourceInfo = {
    isDescriptor: false,
    projectName: 'MismatchedProjectName',
    resourceName: 'MismatchedResourceName',
  };

  it('should not be well formed', () => {
    expect(isDocumentIdWellFormed(invalidId)).toEqual(false);
  });

  it('should be invalid for the mismatched resource info', () => {
    expect(isDocumentIdValidForResource(invalidId, mismatchedResourceInfo)).toEqual(false);
  });
});
