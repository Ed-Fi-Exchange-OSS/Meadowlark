// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { get } from '../../src/handler/FrontendFacade';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';

describe('given there is no resourceId in a get request', () => {
  const request: FrontendRequest = { ...newFrontendRequest(), path: '/1/2/3' };

  beforeAll(async () => {
    // Act
    await get(request);
  });

  it('sets the action to query', () => {
    expect(request.action).toEqual('query');
  });
});

describe('given there is a resourceId in a get request', () => {
  const request: FrontendRequest = {
    ...newFrontendRequest(),
    path: '/1/2/3/6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7',
  };

  beforeAll(async () => {
    // Act
    await get(request);
  });

  it('sets the action to getById', () => {
    expect(request.action).toEqual('getById');
  });
});
