// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as JwtValidator from '../../src/security/JwtValidator';
import { authenticate } from '../../src/middleware/AuthenticationMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { JwtStatus, newJwtStatus } from '../../src/security/JwtStatus';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { JwtValidation } from '../../src/security/JwtValidator';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;
  let mockRequestValidator: any;

  beforeAll(async () => {
    mockRequestValidator = jest.spyOn(JwtValidator, 'validateJwt');

    // Act
    resultChain = await authenticate({ frontendRequest, frontendResponse });
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });

  it('never calls authenticate', () => {
    expect(mockRequestValidator).not.toHaveBeenCalled();
  });
});

describe('given an error response from authenticate', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const errorResponse: FrontendResponse = newFrontendResponse();
  const jwtStatus: JwtStatus = newJwtStatus();
  let resultChain: MiddlewareModel;
  let mockRequestValidator: any;

  beforeAll(async () => {
    const jwtValidation: JwtValidation = { jwtStatus, errorResponse };
    mockRequestValidator = jest.spyOn(JwtValidator, 'validateJwt').mockReturnValue(jwtValidation);

    // Act
    resultChain = await authenticate({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the expected error response', () => {
    expect(resultChain.frontendResponse).toBe(errorResponse);
  });
});

describe('given a valid response from authenticate', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const subject = 'Subject';
  const jwtStatus: JwtStatus = { ...newJwtStatus(), subject };
  let resultChain: MiddlewareModel;
  let mockRequestValidator: any;

  beforeAll(async () => {
    const jwtValidation: JwtValidation = { jwtStatus };
    mockRequestValidator = jest.spyOn(JwtValidator, 'validateJwt').mockReturnValue(jwtValidation);

    // Act
    resultChain = await authenticate({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('adds security to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.security.authorizationStrategy).toBe('OWNERSHIP_BASED');
    expect(resultChain.frontendRequest.middleware.security.clientName).toBe(subject);
  });

  it('does not create a response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});
