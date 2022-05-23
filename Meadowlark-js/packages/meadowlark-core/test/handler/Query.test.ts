// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as RequestValidator from '../../src/validation/RequestValidator';
import { query } from '../../src/handler/Query';
import { QueryResult } from '../../src/message/QueryResult';
import { getQueryHandler } from '../../src/plugin/PluginLoader';
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
      resourceId: null,
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
    response = await query(pathComponents, newFrontendRequest());
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

describe('given persistence fails', () => {
  let response: FrontendResponse;
  let mockRequestValidator: any;
  let mockOpenSearch: any;
  const metaEdHeaders = { header: 'one' };

  beforeAll(async () => {
    const pathComponents = {
      version: 'a',
      namespace: 'b',
      endpointName: 'c',
      resourceId: null,
    };

    // Setup the request validation to succeed
    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        documentInfo: {},
        errorBody: null,
        headerMetadata: metaEdHeaders,
      } as unknown as RequestValidator.ResourceValidationResult),
    );

    // Setup the query operation to fail
    mockOpenSearch = jest.spyOn(getQueryHandler(), 'queryDocuments').mockReturnValue(
      Promise.resolve({
        response: 'UNKNOWN_FAILURE',
        documents: [],
      } as unknown as QueryResult),
    );

    // Act
    response = await query(pathComponents, newFrontendRequest());
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
    mockOpenSearch.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('returns expected headers', () => {
    expect(response.headers).toEqual(metaEdHeaders);
  });
});

describe('given successful fetch from persistence', () => {
  let response: FrontendResponse;
  let mockRequestValidator: any;
  let mockOpenSearch: any;
  const metaEdHeaders = { header: 'one' };
  const goodResult: object = { goodResult: 'result' };

  beforeAll(async () => {
    const pathComponents = {
      version: 'a',
      namespace: 'b',
      endpointName: 'c',
      resourceId: null,
    };

    // Setup the request validation to succeed
    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        documentInfo: {},
        errorBody: null,
        headerMetadata: metaEdHeaders,
      } as unknown as RequestValidator.ResourceValidationResult),
    );

    // Setup the query operation to succeed
    mockOpenSearch = jest.spyOn(getQueryHandler(), 'queryDocuments').mockReturnValue(
      Promise.resolve({
        response: 'QUERY_SUCCESS',
        documents: [goodResult],
      } as unknown as QueryResult),
    );

    // Act
    response = await query(pathComponents, newFrontendRequest());
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
    mockOpenSearch.mockRestore();
  });

  it('returns status 200', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns expected headers', () => {
    expect(response.headers).toEqual(metaEdHeaders);
  });

  it('returns 1 result', () => {
    expect(JSON.parse(response.body)).toHaveLength(1);
  });

  it('returns good result', () => {
    expect(JSON.parse(response.body)[0].goodResult).toEqual('result');
  });
});
