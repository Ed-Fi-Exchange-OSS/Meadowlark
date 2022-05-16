// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getById } from '../../src/handler/GetById';
import * as RequestValidator from '../../src/validation/RequestValidator';
import { Security } from '../../src/model/Security';
import { GetResult } from '../../src/message/GetResult';
import { getDocumentStore } from '../../src/plugin/PluginLoader';
import { FrontendResponse } from '../../src/handler/FrontendResponse';
import { newFrontendRequest } from '../../src/handler/FrontendRequest';

describe('given the endpoint is not in the MetaEd model', () => {
  let response: FrontendResponse;
  let mockRequestValidator: any;
  const metaEdHeaders = { header: 'one' };
  const validationError = { 'this is': 'an error' };

  beforeAll(async () => {
    const pathComponents = {
      version: 'a',
      namespace: 'b',
      endpointName: 'c',
      resourceId: '6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7',
    };

    // Setup the request validation to fail
    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        documentInfo: {},
        errorBody: validationError,
        headerMetadata: metaEdHeaders,
      } as unknown as RequestValidator.ResourceValidationResult),
    );

    // Act
    response = await getById(pathComponents, newFrontendRequest(), {} as Security);
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });
  it('returns the expected error message', () => {
    expect(response.body).toEqual(validationError);
  });
});

describe('given database lookup fails', () => {
  let response: FrontendResponse;
  let mockRequestValidator: any;
  let mockDynamo: any;
  const metaEdHeaders = { header: 'one' };

  beforeAll(async () => {
    const pathComponents = {
      version: 'a',
      namespace: 'b',
      endpointName: 'c',
      resourceId: '6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7',
    };

    // Setup the request validation to succeed
    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        documentInfo: {},
        errorBody: null,
        headerMetadata: metaEdHeaders,
      } as unknown as RequestValidator.ResourceValidationResult),
    );

    // Setup the get operation to fail
    mockDynamo = jest.spyOn(getDocumentStore(), 'getDocumentById').mockReturnValue(
      Promise.resolve({
        response: 'UNKNOWN_FAILURE',
        document: {},
      } as GetResult),
    );

    // Act
    response = await getById(pathComponents, newFrontendRequest(), {} as Security);
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
    mockDynamo.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('returns expected headers', () => {
    expect(response.headers).toEqual(metaEdHeaders);
  });
});

describe('given a valid request', () => {
  let response: FrontendResponse;
  let mockRequestValidator: any;
  let mockDynamo: any;
  const metaEdHeaders = { header: 'one' };

  beforeAll(async () => {
    const pathComponents = {
      version: 'a',
      namespace: 'b',
      endpointName: 'c',
      resourceId: '6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7',
    };

    // Setup the request validation to succeed
    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        documentInfo: {},
        errorBody: null,
        headerMetadata: metaEdHeaders,
      } as RequestValidator.ResourceValidationResult),
    );

    // Setup the get operation to succeed
    mockDynamo = jest.spyOn(getDocumentStore(), 'getDocumentById').mockReturnValue(
      Promise.resolve({
        response: 'GET_SUCCESS',
        document: { a: 'result' },
      } as GetResult),
    );

    // Act
    response = await getById(pathComponents, newFrontendRequest(), {} as Security);
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
    mockDynamo.mockRestore();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns expected headers', () => {
    expect(response.headers).toEqual(metaEdHeaders);
  });

  it('returns expected body', () => {
    expect(response.body).toEqual('{"a":"result"}');
  });
});
