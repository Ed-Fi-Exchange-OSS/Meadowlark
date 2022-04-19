// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyResult, Context } from 'aws-lambda';

import * as RequestValidator from '../../../src/handler/RequestValidator';
import * as DynamoEntityRepository from '../../../src/packages/meadowlark-plugin-dynamodb-opensearch/DynamoEntityRepository';
import { list } from '../../../src/handler/GetResolvers';

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
    response = await list(pathComponents, context);
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

describe('given an error on list fetch from persistence', () => {
  let response: APIGatewayProxyResult;
  let mockRequestValidator: any;
  let mockDynamo: any;

  beforeAll(async () => {
    const pathComponents = {
      version: 'a',
      namespace: 'b',
      endpointName: 'c',
      resourceId: null,
    };
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        entityInfo: {},
        errorBody: null,
        metaEdProjectHeaders: {},
      } as unknown as RequestValidator.ResourceValidationResult),
    );

    // Setup the Dynamo operation to fail
    mockDynamo = jest.spyOn(DynamoEntityRepository, 'getEntityList').mockReturnValue(
      Promise.resolve({
        result: 'ERROR',
        documents: [],
      }),
    );

    // Act
    response = await list(pathComponents, context);
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
    mockDynamo.mockRestore();
  });

  it('returns error status', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('returns an error message', () => {
    expect(JSON.parse(response.body).message).toEqual('Failure');
  });
});

describe('given successful fetch from persistence', () => {
  let response: APIGatewayProxyResult;
  let mockRequestValidator: any;
  let mockDynamo: any;
  const goodResult: object = { goodResult: 'result' };

  beforeAll(async () => {
    const pathComponents = {
      version: 'a',
      namespace: 'b',
      endpointName: 'c',
      resourceId: null,
    };
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        entityInfo: {},
        errorBody: null,
        metaEdProjectHeaders: {},
      } as unknown as RequestValidator.ResourceValidationResult),
    );

    // Setup the Dynamo operation to succeed
    mockDynamo = jest.spyOn(DynamoEntityRepository, 'getEntityList').mockReturnValue(
      Promise.resolve({
        result: 'SUCCESS',
        documents: [goodResult],
      }),
    );

    // Act
    response = await list(pathComponents, context);
  });

  afterAll(() => {
    mockRequestValidator.mockRestore();
    mockDynamo.mockRestore();
  });

  it('returns status ok', () => {
    expect(response.statusCode).toEqual(200);
  });

  it('returns 1 result', () => {
    expect(JSON.parse(response.body)).toHaveLength(1);
  });

  it('returns good result', () => {
    expect(JSON.parse(response.body)[0].goodResult).toEqual('result');
  });
});
