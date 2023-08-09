// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { ValidationError } from '@apideck/better-ajv-errors';
import * as DocumentValidator from '../../src/validation/DocumentValidator';
import { documentValidation } from '../../src/middleware/ValidateDocumentMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';

describe('given a previous middleware for Insert has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;
  let mockDocumentValidator: any;

  beforeAll(async () => {
    mockDocumentValidator = jest.spyOn(DocumentValidator, 'validateDocument');

    // Act
    resultChain = await documentValidation({ frontendRequest, frontendResponse });
  });

  afterAll(() => {
    mockDocumentValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });

  it('never calls validateDocument', () => {
    expect(mockDocumentValidator).not.toHaveBeenCalled();
  });
});

describe('given an error response and document info from documentValidation', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const errorBody = [
    {
      message: 'a',
      path: 'b',
      context: {
        errorType: 'additionalProperties',
      },
    } as ValidationError,
  ];

  let resultChain: MiddlewareModel;
  let mockDocumentValidator: any;

  beforeAll(async () => {
    const validationResult = { error: errorBody };

    mockDocumentValidator = jest
      .spyOn(DocumentValidator, 'validateDocument')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await documentValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockDocumentValidator.mockRestore();
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
          {
            "context": {
              "errorType": "additionalProperties",
            },
            "message": "a",
            "path": "b",
          },
        ],
      }
    `);
  });
});

describe('given a valid response from documentValidation for Insert', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const headerMetadata = {};
  let resultChain: MiddlewareModel;
  let mockDocumentValidator: any;

  beforeAll(async () => {
    mockDocumentValidator = jest.spyOn(DocumentValidator, 'validateDocument').mockReturnValue(Promise.resolve(null));

    // Act
    resultChain = await documentValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockDocumentValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('adds headerMetadata to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.headerMetadata).toEqual(headerMetadata);
  });

  it('does not create a response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});
