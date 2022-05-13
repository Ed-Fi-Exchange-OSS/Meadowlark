// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { parseBody } from '../../src/middleware/ParseBodyMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { MiddlewareChain } from '../../src/middleware/MiddlewareChain';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareChain;

  beforeAll(async () => {
    // Act
    resultChain = await parseBody({ frontendRequest, frontendResponse });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });
});

describe('given a missing body', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareChain;

  beforeAll(async () => {
    frontendRequest.body = null;

    // Act
    resultChain = await parseBody({ frontendRequest, frontendResponse: null });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 400', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(400);
  });

  it('returns the expected error message', () => {
    expect(resultChain.frontendResponse?.body).toMatch('Missing body');
  });
});

describe('given a malformed body', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareChain;

  beforeAll(async () => {
    frontendRequest.body = 'Not JSON';

    // Act
    resultChain = await parseBody({ frontendRequest, frontendResponse: null });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 400', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(400);
  });

  it('returns the expected error message', () => {
    expect(resultChain.frontendResponse?.body).toMatch('Malformed body');
  });
});

describe('given a valid body', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareChain;
  const validBody = '{}';

  beforeAll(async () => {
    frontendRequest.body = validBody;

    // Act
    resultChain = await parseBody({ frontendRequest, frontendResponse: null });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('adds parsedBody to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.parsedBody).toEqual(JSON.parse(validBody));
  });

  it('does not create a response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});
