// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { NoTopLevelEntity } from '@edfi/metaed-core';
import { validateResource, ResourceValidationResult } from '../../src/validation/ResourceValidator';
import * as LoadMetaEd from '../../src/metaed/LoadMetaEd';
import * as MetaEdValidation from '../../src/metaed/MetaEdValidation';
import { NoResourceInfo } from '../../src/model/ResourceInfo';

describe('given an invalid resource name with a suggested matching name', () => {
  let result: ResourceValidationResult;
  let mockLoadMetaEdState: any;
  let mockMatchEndpointToMetaEd: any;
  const matchedMetaEdName = 'match';
  const invalidName = 'Mtch';

  beforeAll(async () => {
    mockLoadMetaEdState = jest.spyOn(LoadMetaEd, 'loadMetaEdState').mockReturnValue(
      Promise.resolve({
        metaEd: {},
        metaEdConfiguration: { projects: [{}] },
      } as any),
    );

    mockMatchEndpointToMetaEd = jest.spyOn(MetaEdValidation, 'matchResourceNameToMetaEd').mockReturnValue({
      resourceName: matchedMetaEdName,
      exact: false,
      suggestion: true,
      matchingMetaEdModel: NoTopLevelEntity,
    } as any);

    // Act
    result = await validateResource({ version: 'a', namespace: 'b', resourceName: invalidName });
  });

  afterAll(() => {
    mockLoadMetaEdState.mockRestore();
    mockMatchEndpointToMetaEd.mockRestore();
  });

  it('returns an error message', () => {
    expect(JSON.parse(result.errorBody ?? '').message).toBe(
      `Invalid resource '${invalidName}'. The most similar resource is '${matchedMetaEdName}'.`,
    );
  });

  it('returns no entity info', () => {
    expect(result.resourceInfo).toBe(NoResourceInfo);
  });
});

describe('given an invalid resource name with no suggested matching name', () => {
  let result: ResourceValidationResult;
  let mockLoadMetaEdState: any;
  let mockMatchEndpointToMetaEd: any;
  const invalidName = 'Mtch';

  beforeAll(async () => {
    mockLoadMetaEdState = jest.spyOn(LoadMetaEd, 'loadMetaEdState').mockReturnValue(
      Promise.resolve({
        metaEd: {},
        metaEdConfiguration: { projects: [{}] },
      } as any),
    );

    mockMatchEndpointToMetaEd = jest.spyOn(MetaEdValidation, 'matchResourceNameToMetaEd').mockReturnValue({
      resourceName: '',
      exact: false,
      suggestion: false,
      matchingMetaEdModel: NoTopLevelEntity,
    } as any);

    // Act
    result = await validateResource({ version: 'a', namespace: 'b', resourceName: invalidName });
  });

  afterAll(() => {
    mockLoadMetaEdState.mockRestore();
    mockMatchEndpointToMetaEd.mockRestore();
  });

  it('returns an error message', () => {
    expect(JSON.parse(result.errorBody ?? '').message).toBe(`Invalid resource '${invalidName}'.`);
  });

  it('returns no entity info', () => {
    expect(result.resourceInfo).toBe(NoResourceInfo);
  });
});

describe('given resource `schoolYearTypes`', () => {
  let result: ResourceValidationResult;
  const invalidName = 'schoolYearTypes';

  beforeAll(async () => {
    // Act
    result = await validateResource({ version: 'a', namespace: 'b', resourceName: invalidName });
  });

  it('returns an error message', () => {
    expect(JSON.parse(result.errorBody ?? '').message.length).toBeGreaterThan(0);
  });

  it('returns no entity info', () => {
    expect(result.resourceInfo).toBe(NoResourceInfo);
  });
});
