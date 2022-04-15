// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyResult, Context } from 'aws-lambda';

import * as RequestValidator from '../../../src/handler/RequestValidator';
import * as ElasticsearchRepository from '../../../src/packages/dynamodb-opensearch/ElasticsearchRepository';
import { query } from '../../../src/handler/GetResolvers';
import { SearchResult } from '../../../src/plugin/backend/SearchResult';

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
      resourceId: null,
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
    response = await query(pathComponents, {}, context);
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
  let response: APIGatewayProxyResult;
  let mockRequestValidator: any;
  let mockElasticsearch: any;
  const metaEdHeaders = { header: 'one' };

  beforeAll(async () => {
    const pathComponents = {
      version: 'a',
      namespace: 'b',
      endpointName: 'c',
      resourceId: null,
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

    // Setup the Elasticsearch operation to fail
    mockElasticsearch = jest.spyOn(ElasticsearchRepository, 'queryEntityList').mockReturnValue(
      Promise.resolve({
        success: false,
        results: [],
      } as unknown as SearchResult),
    );

    // Act
    response = await query(pathComponents, {}, context);
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
    mockElasticsearch.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('returns expected headers', () => {
    expect(response.headers).toEqual(metaEdHeaders);
  });
});

describe('given successful fetch from persistence', () => {
  let response: APIGatewayProxyResult;
  let mockRequestValidator: any;
  let mockElasticsearch: any;
  const metaEdHeaders = { header: 'one' };
  const goodResult: object = { goodResult: 'result' };

  beforeAll(async () => {
    const pathComponents = {
      version: 'a',
      namespace: 'b',
      endpointName: 'c',
      resourceId: null,
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

    // Setup the Elasticsearch operation to succeed
    mockElasticsearch = jest.spyOn(ElasticsearchRepository, 'queryEntityList').mockReturnValue(
      Promise.resolve({
        success: true,
        results: [goodResult],
      } as unknown as SearchResult),
    );

    // Act
    response = await query(pathComponents, {}, context);
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
    mockElasticsearch.mockRestore();
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
