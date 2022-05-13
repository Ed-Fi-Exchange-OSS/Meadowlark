// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getResolver } from '../../src/handler/Get';
import * as Query from '../../src/handler/Query';
import * as GetById from '../../src/handler/GetById';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { PathComponents } from '../../src/model/PathComponents';

describe('given there is no resourceId in the request', () => {
  const noResourceId: PathComponents = {
    endpointName: '1',
    namespace: '2',
    version: '3',
    resourceId: null,
  };

  const request: FrontendRequest = newFrontendRequest();
  let mockQuery: any;
  let mockGetById: any;

  beforeAll(async () => {
    request.middleware.pathComponents = noResourceId;
    mockQuery = jest.spyOn(Query, 'query');
    mockGetById = jest.spyOn(GetById, 'getById');

    // Act
    await getResolver(request);
  });

  afterAll(() => {
    mockQuery.mockRestore();
    mockGetById.mockRestore();
  });

  it('forwards to query', () => {
    expect(mockQuery).toHaveBeenCalled();
  });

  it('does not forward to getById', () => {
    expect(mockGetById).not.toHaveBeenCalled();
  });
});

describe('given there is a resourceId in the request', () => {
  const withResourceId: PathComponents = {
    endpointName: '1',
    namespace: '2',
    version: '3',
    resourceId: '6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7',
  };

  const request: FrontendRequest = newFrontendRequest();
  let mockQuery: any;
  let mockGetById: any;

  beforeAll(async () => {
    request.middleware.pathComponents = withResourceId;
    mockQuery = jest.spyOn(Query, 'query');
    mockGetById = jest.spyOn(GetById, 'getById');

    // Act
    await getResolver(request);
  });

  afterAll(() => {
    mockQuery.mockRestore();
    mockGetById.mockRestore();
  });

  it('forwards to getById', () => {
    expect(mockGetById).toHaveBeenCalled();
  });

  it('does not forward to query', () => {
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
