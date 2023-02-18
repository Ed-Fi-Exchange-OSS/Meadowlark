// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { initializeLogging } from '@edfi/meadowlark-utilities';
import { get } from '../../src/handler/FrontendFacade';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { setupMockConfiguration } from '../ConfigHelper';

const documentUuid = '2edb604f-eab0-412c-a242-508d6529214d';

describe('given there is no resourceId in a get request', () => {
  const request: FrontendRequest = { ...newFrontendRequest(), path: '/1/2/3' };

  beforeAll(async () => {
    setupMockConfiguration();
    initializeLogging();

    // Act
    await get(request);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('sets the action to query', () => {
    expect(request.action).toEqual('query');
  });
});

describe('given there is a resourceId in a get request', () => {
  const request: FrontendRequest = {
    ...newFrontendRequest(),
    path: `/1/2/3/${documentUuid}`,
  };

  beforeAll(async () => {
    setupMockConfiguration();
    initializeLogging();

    // Act
    await get(request);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('sets the action to getById', () => {
    expect(request.action).toEqual('getById');
  });
});
