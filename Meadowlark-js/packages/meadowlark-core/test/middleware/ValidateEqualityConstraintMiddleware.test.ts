// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as EqualityConstraintValidator from '../../src/validation/EqualityConstraintValidator';
import { equalityConstraintValidation } from '../../src/middleware/ValidateEqualityConstraintMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;
  let mockEqualityConstraintValidator: any;

  beforeAll(async () => {
    mockEqualityConstraintValidator = jest.spyOn(EqualityConstraintValidator, 'validateEqualityConstraints');

    // Act
    resultChain = await equalityConstraintValidation({ frontendRequest, frontendResponse });
  });

  afterAll(() => {
    mockEqualityConstraintValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });

  it('never calls equalityConstraintValidation', () => {
    expect(mockEqualityConstraintValidator).not.toHaveBeenCalled();
  });
});

describe('given an error response from equalityConstraintValidation', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;
  let mockResourceValidator: any;

  beforeAll(async () => {
    const validationResult: string[] = ['An error occurred XYZ'];

    mockResourceValidator = jest
      .spyOn(EqualityConstraintValidator, 'validateEqualityConstraints')
      .mockReturnValue(validationResult);

    // Act
    resultChain = await equalityConstraintValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockResourceValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 400', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(400);
  });

  it('returns the expected error message', () => {
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": [
          "An error occurred XYZ",
        ],
      }
    `);
  });
});

describe('given no error response from equalityConstraintValidation', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;
  let mockResourceValidator: any;

  beforeAll(async () => {
    mockResourceValidator = jest.spyOn(EqualityConstraintValidator, 'validateEqualityConstraints').mockReturnValue([]);

    // Act
    resultChain = await equalityConstraintValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockResourceValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns no response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});
