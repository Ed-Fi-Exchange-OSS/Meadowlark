// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { timestampRequest } from '../../src/middleware/TimestampRequestMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    // Act
    resultChain = await timestampRequest({ frontendRequest, frontendResponse });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });
});

describe('given no previous middleware response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let result: MiddlewareModel;

  beforeAll(async () => {
    // Act
    result = await timestampRequest({ frontendRequest, frontendResponse: null });
  });

  it('returns frontendRequest with a recent timestamp', () => {
    const oneSecond = 1000;
    expect(result.frontendRequest.middleware.timestamp).toBeGreaterThan(Date.now() - oneSecond);
    expect(result.frontendRequest.middleware.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('does not modify frontendResponse', () => {
    expect(result.frontendResponse).toBeNull();
  });
});
