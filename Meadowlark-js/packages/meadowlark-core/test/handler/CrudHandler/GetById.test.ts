// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyResult, Context } from 'aws-lambda';

import { getById } from '../../../src/handler/GetResolvers';
import * as RequestValidator from '../../../src/handler/RequestValidator';
import { Security } from '../../../src/model/Security';
import { GetResult } from '../../../src/plugin/backend/GetResult';
import { backendPlugin } from '../../../src/plugin/PluginLoader';

describe('given the endpoint is not in the MetaEd model', () => {
  let response: APIGatewayProxyResult;
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
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Setup the request validation to fail
    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        entityInfo: {},
        errorBody: validationError,
        metaEdProjectHeaders: metaEdHeaders,
      } as unknown as RequestValidator.ResourceValidationResult),
    );

    // Act
    response = await getById(pathComponents, context, {} as Security);
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
  let response: APIGatewayProxyResult;
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
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Setup the request validation to succeed
    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        entityInfo: {},
        errorBody: null,
        metaEdProjectHeaders: metaEdHeaders,
      } as unknown as RequestValidator.ResourceValidationResult),
    );

    // Setup the get operation to fail
    mockDynamo = jest.spyOn(backendPlugin, 'getEntityById').mockReturnValue(
      Promise.resolve({
        result: 'ERROR',
        documents: [],
        failureMessage: null,
      } as GetResult),
    );

    // Act
    response = await getById(pathComponents, context, {} as Security);
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
  let response: APIGatewayProxyResult;
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
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Setup the request validation to succeed
    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        entityInfo: {},
        errorBody: null,
        metaEdProjectHeaders: metaEdHeaders,
      } as RequestValidator.ResourceValidationResult),
    );

    // Setup the get operation to succeed
    mockDynamo = jest.spyOn(backendPlugin, 'getEntityById').mockReturnValue(
      Promise.resolve({
        result: 'SUCCESS',
        failureMessage: null,
        documents: [{ a: 'result' }],
      } as GetResult),
    );

    // Act
    response = await getById(pathComponents, context, {} as Security);
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
