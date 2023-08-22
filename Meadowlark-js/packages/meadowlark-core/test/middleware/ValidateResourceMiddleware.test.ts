// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as ResourceValidator from '../../src/validation/ResourceValidator';
import { resourceValidation } from '../../src/middleware/ValidateResourceMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { newResourceInfo, NoResourceInfo } from '../../src/model/ResourceInfo';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { DocumentUuid } from '../../src/model/IdTypes';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;
  let mockResourceValidator: any;

  beforeAll(async () => {
    mockResourceValidator = jest.spyOn(ResourceValidator, 'validateResource');

    // Act
    resultChain = await resourceValidation({ frontendRequest, frontendResponse });
  });

  afterAll(() => {
    mockResourceValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });

  it('never calls resourceValidation', () => {
    expect(mockResourceValidator).not.toHaveBeenCalled();
  });
});

describe('given an error response and no document info from resourceValidation', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;
  const errorBody = 'An error occurred XYZ';
  let mockResourceValidator: any;

  beforeAll(async () => {
    const validationResult: ResourceValidator.ResourceValidationResult = {
      resourceInfo: NoResourceInfo,
      errorBody,
      resourceName: '',
    };

    mockResourceValidator = jest
      .spyOn(ResourceValidator, 'validateResource')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await resourceValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockResourceValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });

  it('returns the expected error message', () => {
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`"An error occurred XYZ"`);
  });
});

describe('given an error response and document info from resourceValidation', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const errorBody = 'An error occurred';
  let resultChain: MiddlewareModel;
  let mockResourceValidator: any;

  beforeAll(async () => {
    const validationResult: ResourceValidator.ResourceValidationResult = {
      resourceInfo: newResourceInfo(),
      errorBody,
      resourceName: '',
    };

    mockResourceValidator = jest
      .spyOn(ResourceValidator, 'validateResource')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await resourceValidation({ frontendRequest, frontendResponse: null });
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
    expect(resultChain.frontendResponse?.body).toEqual(errorBody);
  });
});

describe('given a valid response from resourceValidation', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const resourceInfo = newResourceInfo();
  const headerMetadata = {};
  let resultChain: MiddlewareModel;
  let mockResourceValidator: any;

  beforeAll(async () => {
    const validationResult: ResourceValidator.ResourceValidationResult = {
      resourceInfo,
      resourceName: '',
      headerMetadata,
    };

    mockResourceValidator = jest
      .spyOn(ResourceValidator, 'validateResource')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await resourceValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockResourceValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('adds resourceInfo to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.resourceInfo).toBe(resourceInfo);
  });

  it('adds headerMetadata to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.headerMetadata).toEqual(headerMetadata);
  });

  it('does not create a response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});

describe('given requesting abstract domain entity', () => {
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    const frontendRequest: FrontendRequest = {
      ...newFrontendRequest(),
      body: '{"documentUuid": "db4f71a9-30dd-407a-ace4-07a056f781a3", "body": "a body"}',
      headers: { 'reference-validation': 'false' },
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: {
          resourceName: 'educationOrganizations',
          namespace: 'ed-fi',
          version: 'v3.3b',
          documentUuid: 'db4f71a9-30dd-407a-ace4-07a056f781a3' as DocumentUuid,
        },
      },
    };

    // Act
    resultChain = await resourceValidation({ frontendRequest, frontendResponse: null });
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });

  it('returns the expected message body', () => {
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Invalid resource 'educationOrganizations'. The most similar resource is 'educationOrganizationNetworks'.",
      }
    `);
  });
});

describe('given requesting abstract association', () => {
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    const frontendRequest: FrontendRequest = {
      ...newFrontendRequest(),
      body: '{"documentUuid": "df4f71a9-30dd-407a-ace4-07a056f781a3", "body": "a body"}',
      headers: { 'reference-validation': 'false' },
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: {
          resourceName: 'generalStudentProgramAssociations',
          namespace: 'ed-fi',
          version: 'v3.3b',
          documentUuid: 'df4f71a9-30dd-407a-ace4-07a056f781a3' as DocumentUuid,
        },
      },
    };

    // Act
    resultChain = await resourceValidation({ frontendRequest, frontendResponse: null });
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });

  it('returns the expected message body', () => {
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Invalid resource 'generalStudentProgramAssociations'. The most similar resource is 'studentProgramAssociations'.",
      }
    `);
  });
});
