// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as QueryStringValidator from '../../src/validation/QueryStringValidator';
import * as PaginationValidator from '../../src/validation/PaginationValidator';
import { queryValidation } from '../../src/middleware/ValidateQueryMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;
  let mockQueryStringValidator: any;
  let mockPaginationValidator: any;

  beforeAll(async () => {
    mockQueryStringValidator = jest.spyOn(QueryStringValidator, 'validateQueryString');
    mockPaginationValidator = jest.spyOn(PaginationValidator, 'validatePaginationParameters');

    // Act
    resultChain = await queryValidation({ frontendRequest, frontendResponse });
  });

  afterAll(() => {
    mockQueryStringValidator.mockRestore();
    mockPaginationValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });

  it('never calls document validator', () => {
    expect(mockQueryStringValidator).not.toHaveBeenCalled();
  });

  it('never calls pagination validator', () => {
    expect(mockPaginationValidator).not.toHaveBeenCalled();
  });
});

describe('given there are no query string parameters in the request', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    queryParameters: {},
  };

  let resultChain: MiddlewareModel;
  let mockQueryStringValidator: any;
  let mockPaginationValidator: any;

  beforeAll(async () => {
    mockQueryStringValidator = jest.spyOn(QueryStringValidator, 'validateQueryString');
    mockPaginationValidator = jest.spyOn(PaginationValidator, 'validatePaginationParameters');

    // Act
    resultChain = await queryValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockQueryStringValidator.mockRestore();
    mockPaginationValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a null response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });

  it('never calls document validator', () => {
    expect(mockQueryStringValidator).not.toHaveBeenCalled();
  });

  it('never calls pagination validator', () => {
    expect(mockPaginationValidator).not.toHaveBeenCalled();
  });
});

describe('given an error response from validatePaginationParameters', () => {
  const errorBody = { message: 'An error' };
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    queryParameters: { key: 'value' },
  };

  let resultChain: MiddlewareModel;
  let mockQueryStringValidator: any;
  let mockPaginationValidator: any;

  beforeAll(async () => {
    mockQueryStringValidator = jest.spyOn(QueryStringValidator, 'validateQueryString');
    mockPaginationValidator = jest.spyOn(PaginationValidator, 'validatePaginationParameters').mockReturnValue(errorBody);

    // Act
    resultChain = await queryValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockQueryStringValidator.mockRestore();
    mockPaginationValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the expected error response', () => {
    expect(resultChain.frontendResponse?.body).toBe(errorBody);
    expect(resultChain.frontendResponse?.statusCode).toBe(400);
  });

  it('never calls document validator', () => {
    expect(mockQueryStringValidator).not.toHaveBeenCalled();
  });
});

describe('given an error response from validateQueryString', () => {
  const errorBody: string = 'An error';
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    queryParameters: { key: 'value' },
  };

  let resultChain: MiddlewareModel;
  let mockQueryStringValidator: any;
  let mockPaginationValidator: any;

  beforeAll(async () => {
    mockQueryStringValidator = jest.spyOn(QueryStringValidator, 'validateQueryString').mockReturnValue({ errorBody });
    mockPaginationValidator = jest.spyOn(PaginationValidator, 'validatePaginationParameters').mockReturnValue(undefined);

    // Act
    resultChain = await queryValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockQueryStringValidator.mockRestore();
    mockPaginationValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the expected error response', () => {
    expect(resultChain.frontendResponse?.body).toBe(errorBody);
    expect(resultChain.frontendResponse?.statusCode).toBe(400);
  });
});

describe('given valid responses', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    queryParameters: { key: 'value' },
  };

  let resultChain: MiddlewareModel;
  let mockQueryStringValidator: any;
  let mockPaginationValidator: any;

  beforeAll(async () => {
    mockQueryStringValidator = jest
      .spyOn(QueryStringValidator, 'validateQueryString')
      .mockReturnValue({ errorBody: undefined });
    mockPaginationValidator = jest.spyOn(PaginationValidator, 'validatePaginationParameters').mockReturnValue(undefined);

    // Act
    resultChain = await queryValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockQueryStringValidator.mockRestore();
    mockPaginationValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a null response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});
