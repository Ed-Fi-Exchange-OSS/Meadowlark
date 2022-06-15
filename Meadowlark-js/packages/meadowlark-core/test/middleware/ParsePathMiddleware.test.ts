// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { parsePath } from '../../src/middleware/ParsePathMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    // Act
    resultChain = await parsePath({ frontendRequest, frontendResponse });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });
});

describe('given an empty path', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    frontendRequest.path = '';

    // Act
    resultChain = await parsePath({ frontendRequest, frontendResponse: null });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });
});

describe('given an invalid path', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    frontendRequest.path = 'badpath';

    // Act
    resultChain = await parsePath({ frontendRequest, frontendResponse: null });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });
});

describe('given a valid path without resourceId', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    frontendRequest.path = '/1/2/3';

    // Act
    resultChain = await parsePath({ frontendRequest, frontendResponse: null });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('adds pathComponents to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.pathComponents).toMatchInlineSnapshot(`
      Object {
        "endpointName": "3",
        "namespace": "2",
        "resourceId": undefined,
        "version": "1",
      }
    `);
  });

  it('does not create a response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});

describe('given a valid path with resourceId', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    frontendRequest.path = '/1/2/3/41AiptSy4zB1LVa5K7YmGOQl9VvB4wX3Odiobg';

    // Act
    resultChain = await parsePath({ frontendRequest, frontendResponse: null });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('adds pathComponents to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.pathComponents).toMatchInlineSnapshot(`
      Object {
        "endpointName": "3",
        "namespace": "2",
        "resourceId": "41AiptSy4zB1LVa5K7YmGOQl9VvB4wX3Odiobg",
        "version": "1",
      }
    `);
  });

  it('does not create a response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});

describe('given a path with invalid resourceId', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    frontendRequest.path = '/1/2/3/x';

    // Act
    resultChain = await parsePath({ frontendRequest, frontendResponse: null });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });
});
