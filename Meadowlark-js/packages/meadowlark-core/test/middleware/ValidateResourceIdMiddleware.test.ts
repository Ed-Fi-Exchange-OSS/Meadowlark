// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as DocumentIdValidator from '../../src/validation/DocumentIdValidator';
import { resourceIdValidation } from '../../src/middleware/ValidateResourceIdMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { newPathComponents } from '../../src/model/PathComponents';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;
  let mockResourceIdValidator: any;

  beforeAll(async () => {
    mockResourceIdValidator = jest.spyOn(DocumentIdValidator, 'isDocumentIdValidForResource');

    // Act
    resultChain = await resourceIdValidation({ frontendRequest, frontendResponse });
  });

  afterAll(() => {
    mockResourceIdValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });

  it('never calls resourceIdValidation', () => {
    expect(mockResourceIdValidator).not.toHaveBeenCalled();
  });
});

describe('given no documentUuid in frontend request', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;
  let mockResourceIdValidator: any;

  beforeAll(async () => {
    mockResourceIdValidator = jest.spyOn(DocumentIdValidator, 'isDocumentIdValidForResource');

    // Act
    resultChain = await resourceIdValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockResourceIdValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a null response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });

  it('never calls resourceIdValidation', () => {
    expect(mockResourceIdValidator).not.toHaveBeenCalled();
  });
});

describe('given an invalid response from resourceIdValidation', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  frontendRequest.middleware.pathComponents = {
    ...newPathComponents(),
    documentUuid: '00000000-0000-0000-0000-000000000000',
  };
  let resultChain: MiddlewareModel;
  let mockResourceIdValidator: any;

  beforeAll(async () => {
    mockResourceIdValidator = jest.spyOn(DocumentIdValidator, 'isDocumentIdValidForResource').mockReturnValue(false);

    // Act
    resultChain = await resourceIdValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockResourceIdValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });

  it('returns an empty body', () => {
    expect(resultChain.frontendResponse?.body).toBeUndefined();
  });
});

describe('given a valid response from resourceIdValidation', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  frontendRequest.middleware.pathComponents = {
    ...newPathComponents(),
    documentUuid: '00000000-0000-0000-0000-000000000000',
  };
  let resultChain: MiddlewareModel;
  let mockResourceIdValidator: any;

  beforeAll(async () => {
    mockResourceIdValidator = jest.spyOn(DocumentIdValidator, 'isDocumentIdValidForResource').mockReturnValue(true);

    // Act
    resultChain = await resourceIdValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockResourceIdValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('does not create a response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});
