// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config, initializeLogging } from '@edfi/meadowlark-utilities';
import { get } from '../../src/handler/FrontendFacade';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';

const setupMockConfiguration = () => {
  jest.spyOn(Config, 'get').mockImplementation((key: Config.ConfigKeys) => {
    switch (key) {
      case 'IS_LOCAL':
        return true;
      case 'LOG_LEVEL':
        return 'ERROR';
      default:
        throw new Error(`Key '${key}' not configured`);
    }
  });
};
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
    path: '/1/2/3/aquYJFOsedv9pkccRrndKwuojRMjOz_rdD7rJA',
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
