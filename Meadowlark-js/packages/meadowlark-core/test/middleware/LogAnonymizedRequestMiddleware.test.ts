// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { initializeLogging } from '@edfi/meadowlark-utilities';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { anonymizeAndLogRequestBody } from '../../src/middleware/LogAnonymizedRequestMiddleware';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    initializeLogging();

    // Act
    resultChain = await anonymizeAndLogRequestBody({ frontendRequest, frontendResponse });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });
});

describe('given a null response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    initializeLogging();

    // Act
    resultChain = await anonymizeAndLogRequestBody({ frontendRequest, frontendResponse: null });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a null response', () => {
    expect(resultChain.frontendResponse).toBe(null);
  });
});
