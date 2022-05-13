// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as RequestValidator from '../../src/validation/RequestValidator';
import { validateResource } from '../../src/middleware/ValidateResourceMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { newDocumentInfo, NoDocumentInfo } from '../../src/model/DocumentInfo';
import { MiddlewareChain } from '../../src/middleware/MiddlewareChain';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareChain;
  let mockRequestValidator: any;

  beforeAll(async () => {
    mockRequestValidator = jest.spyOn(RequestValidator, 'validateRequest');

    // Act
    resultChain = await validateResource({ frontendRequest, frontendResponse });
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

  it('never calls validateResource', () => {
    expect(mockRequestValidator).not.toHaveBeenCalled();
  });
});

describe('given an error response and no document info from validateResource', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareChain;
  const errorBody = 'An error occurred';
  let mockRequestValidator: any;

  beforeAll(async () => {
    const validationResult: RequestValidator.ResourceValidationResult = {
      documentInfo: NoDocumentInfo,
      errorBody,
    };

    mockRequestValidator = jest
      .spyOn(RequestValidator, 'validateRequest')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await validateResource({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });

  it('returns the expected error message', () => {
    expect(resultChain.frontendResponse?.body).toEqual(errorBody);
  });
});

describe('given an error response and document info from validateResource', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const errorBody = 'An error occurred';
  let resultChain: MiddlewareChain;
  let mockRequestValidator: any;

  beforeAll(async () => {
    const validationResult: RequestValidator.ResourceValidationResult = {
      documentInfo: newDocumentInfo(),
      errorBody,
    };

    mockRequestValidator = jest
      .spyOn(RequestValidator, 'validateRequest')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await validateResource({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 400', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(400);
  });

  it('returns the expected error message', () => {
    expect(resultChain.frontendResponse?.body).toEqual(errorBody);
  });
});

describe('given a valid response from validateResource', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const documentInfo = newDocumentInfo();
  const headerMetadata = {};
  let resultChain: MiddlewareChain;
  let mockRequestValidator: any;

  beforeAll(async () => {
    const validationResult: RequestValidator.ResourceValidationResult = {
      documentInfo,
      errorBody: null,
      headerMetadata,
    };

    mockRequestValidator = jest
      .spyOn(RequestValidator, 'validateRequest')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await validateResource({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('adds documentInfo to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.documentInfo).toBe(documentInfo);
  });

  it('adds headerMetadata to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.headerMetadata).toEqual(headerMetadata);
  });

  it('does not create a response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});

describe('given requesting abstract domain entity', () => {
  let resultChain: MiddlewareChain;

  beforeAll(async () => {
    const frontendRequest: FrontendRequest = {
      ...newFrontendRequest(),
      body: '{"id": "0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb", "body": "a body"}',
      headers: { 'reference-validation': 'false' },
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: {
          endpointName: 'educationOrganizations',
          namespace: 'ed-fi',
          version: 'v3.3b',
          resourceId: '0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb',
        },
      },
    };

    // Act
    resultChain = await validateResource({ frontendRequest, frontendResponse: null });
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });

  it('returns the expected message body', () => {
    expect(resultChain.frontendResponse?.body).toEqual(
      '{"message":"Invalid resource \'educationOrganizations\'. The most similar resource is \'educationOrganizationNetworks\'."}',
    );
  });
});

describe('given requesting abstract association', () => {
  let resultChain: MiddlewareChain;

  beforeAll(async () => {
    const frontendRequest: FrontendRequest = {
      ...newFrontendRequest(),
      body: '{"id": "0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb", "body": "a body"}',
      headers: { 'reference-validation': 'false' },
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: {
          endpointName: 'generalStudentProgramAssociations',
          namespace: 'ed-fi',
          version: 'v3.3b',
          resourceId: '0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb',
        },
      },
    };

    // Act
    resultChain = await validateResource({ frontendRequest, frontendResponse: null });
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });

  it('returns the expected message body', () => {
    expect(resultChain.frontendResponse?.body).toEqual(
      '{"message":"Invalid resource \'generalStudentProgramAssociations\'. The most similar resource is \'studentProgramAssociations\'."}',
    );
  });
});
