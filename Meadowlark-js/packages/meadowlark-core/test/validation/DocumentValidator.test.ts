// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { newDomainEntity, newTopLevelEntity } from '@edfi/metaed-core';
import { validateDocument } from '../../src/validation/DocumentValidator';
import * as LoadMetaEd from '../../src/metaed/LoadMetaEd';
import * as MetaEdValidation from '../../src/metaed/MetaEdValidation';
import * as ResourceNameMapping from '../../src/metaed/ResourceNameMapping';

describe('given a valid resource name but body fails schema validation', () => {
  let result: string;
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

    mockMatchEndpointToMetaEd = jest.spyOn(ResourceNameMapping, 'getMetaEdModelForResourceName').mockReturnValue({
      ...newDomainEntity(),
      metaEdName: 'DomainEntityName',
      data: { meadowlark: { apiMapping: { assignableTo: null } } },
    } as any);

    // Act
    result = await validateDocument(
      { version: 'a', namespace: 'b', endpointName: 'match', resourceId: null },
      newTopLevelEntity(),
    );
  });

  afterAll(() => {
    mockValidateBodyAgainstSchema.mockRestore();
    mockLoadMetaEdState.mockRestore();
    mockMatchEndpointToMetaEd.mockRestore();
  });

  it('returns an error message', () => {
    expect(JSON.parse(result).message).toEqual([failureMessage]);
  });
});
