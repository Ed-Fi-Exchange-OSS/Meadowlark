// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { newDomainEntity, NoTopLevelEntity } from '@edfi/metaed-core';
import { validateRequest, ResourceValidationResult } from '../../src/validation/RequestValidator';
import * as LoadMetaEd from '../../src/metaed/LoadMetaEd';
import * as MetaEdValidation from '../../src/metaed/MetaEdValidation';
import { NoDocumentInfo } from '../../src/model/DocumentInfo';

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
    result = await validateRequest({ version: 'a', namespace: 'b', endpointName: invalidName, resourceId: null }, {});
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
    expect(result.documentInfo).toBe(NoDocumentInfo);
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
    result = await validateRequest({ version: 'a', namespace: 'b', endpointName: invalidName, resourceId: null }, {});
  });

  afterAll(() => {
    mockLoadMetaEdState.mockRestore();
    mockMatchEndpointToMetaEd.mockRestore();
  });

  it('returns an error message', () => {
    expect(JSON.parse(result.errorBody ?? '').message).toBe(`Invalid resource '${invalidName}'.`);
  });

  it('returns no entity info', () => {
    expect(result.documentInfo).toBe(NoDocumentInfo);
  });
});

describe('given a valid resource name but body fails schema validation', () => {
  let result: ResourceValidationResult;
  let mockValidateBodyAgainstSchema: any;
  let mockLoadMetaEdState: any;
  let mockMatchEndpointToMetaEd: any;
  const failureMessage = 'failed';

  beforeAll(async () => {
    mockValidateBodyAgainstSchema = jest
      .spyOn(MetaEdValidation, 'validateEntityBodyAgainstSchema')
      .mockReturnValue([failureMessage]);

    mockLoadMetaEdState = jest.spyOn(LoadMetaEd, 'loadMetaEdState').mockReturnValue(
      Promise.resolve({
        metaEd: {},
        metaEdConfiguration: { projects: [{}] },
      } as any),
    );

    mockMatchEndpointToMetaEd = jest.spyOn(MetaEdValidation, 'matchResourceNameToMetaEd').mockReturnValue({
      resourceName: '',
      exact: true,
      suggestion: false,
      matchingMetaEdModel: {
        ...newDomainEntity(),
        metaEdName: 'DomainEntityName',
        data: { meadowlark: { apiMapping: { assignableTo: null } } },
      },
    } as any);

    // Act
    result = await validateRequest({ version: 'a', namespace: 'b', endpointName: 'match', resourceId: null }, {});
  });

  afterAll(() => {
    mockValidateBodyAgainstSchema.mockRestore();
    mockLoadMetaEdState.mockRestore();
    mockMatchEndpointToMetaEd.mockRestore();
  });

  it('returns an error message', () => {
    expect(JSON.parse(result.errorBody ?? '').message).toEqual([failureMessage]);
  });
});
