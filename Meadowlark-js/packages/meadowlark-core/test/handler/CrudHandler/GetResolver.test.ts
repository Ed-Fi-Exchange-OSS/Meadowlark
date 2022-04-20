// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as GetResolvers from '../../../src/handler/GetResolvers';
import { getResolver } from '../../../src/handler/CrudHandler';

process.env.ACCESS_TOKEN_REQUIRED = 'false';

describe('given a missing resource path', () => {
  let response: APIGatewayProxyResult;

  beforeAll(async () => {
    const event: APIGatewayProxyEvent = {
      body: '',
      headers: '',
      requestContext: { requestId: 'ApiGatewayRequestId' },
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Act
    response = await getResolver(event, context);
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns no error message', () => {
    expect(response.body).toEqual('');
  });
});

describe('given a path with only a version', () => {
  let response: APIGatewayProxyResult;

  beforeAll(async () => {
    const event: APIGatewayProxyEvent = {
      body: '',
      headers: '',
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path: '/v3.3b',
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Act
    response = await getResolver(event, context);
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns no error message', () => {
    expect(response.body).toEqual('');
  });
});

describe('given a path with version and namespace', () => {
  let response: APIGatewayProxyResult;

  beforeAll(async () => {
    const event: APIGatewayProxyEvent = {
      body: '',
      headers: '',
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path: '/v3.3b/ed-fi',
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Act
    response = await getResolver(event, context);
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns no error message', () => {
    expect(response.body).toEqual('');
  });
});

describe('given requesting abstract classes by id', () => {
  const response: APIGatewayProxyResult[] = [];

  beforeAll(async () => {
    const event: APIGatewayProxyEvent = {
      headers: { 'reference-validation': false },
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path: 'local/v3.3b/ed-fi/educationOrganizations/a0df76bba8212ea9b1a20c29591e940045dec9d65ee89603c31f0830',
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Act
    response[0] = await getResolver(event, context);

    event.path =
      'local/v3.3b/ed-fi/GeneralStudentProgramAssociations/a0df76bba8212ea9b1a20c29591e940045dec9d65ee89603c31f0830';
    response[1] = await getResolver(event, context);
  });

  it('returns status 404', () => {
    expect(response[0].statusCode).toEqual(404);
    expect(response[1].statusCode).toEqual(404);
  });

  it('returns the expected message body', () => {
    expect(response[0].body).toEqual(
      '{"message":"Invalid resource \'educationOrganizations\'. The most similar resource is \'educationOrganizationNetworks\'."}',
    );
    expect(response[1].body).toEqual(
      '{"message":"Invalid resource \'GeneralStudentProgramAssociations\'. The most similar resource is \'studentProgramAssociations\'."}',
    );
  });
});

describe('given requesting abstract classes', () => {
  const response: APIGatewayProxyResult[] = [];

  beforeAll(async () => {
    const event: APIGatewayProxyEvent = {
      headers: { 'reference-validation': false },
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path: 'local/v3.3b/ed-fi/educationOrganizations',
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Act
    response[0] = await getResolver(event, context);

    event.path = 'local/v3.3b/ed-fi/GeneralStudentProgramAssociations';
    response[1] = await getResolver(event, context);
  });

  it('returns status 404', () => {
    expect(response[0].statusCode).toEqual(404);
    expect(response[1].statusCode).toEqual(404);
  });

  it('returns the expected message body', () => {
    expect(response[0].body).toEqual(
      '{"message":"Invalid resource \'educationOrganizations\'. The most similar resource is \'educationOrganizationNetworks\'."}',
    );
    expect(response[1].body).toEqual(
      '{"message":"Invalid resource \'GeneralStudentProgramAssociations\'. The most similar resource is \'studentProgramAssociations\'."}',
    );
  });
});

describe('given a valid get by id request', () => {
  let mockGetById;
  let mockList;
  let mockQuery;

  beforeAll(async () => {
    mockGetById = jest.spyOn(GetResolvers, 'getById').mockImplementation((() => null) as any);
    mockList = jest.spyOn(GetResolvers, 'list').mockImplementation((() => null) as any);
    mockQuery = jest.spyOn(GetResolvers, 'query').mockImplementation((() => null) as any);

    const event: APIGatewayProxyEvent = {
      body: '',
      headers: '',
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path: '/v3.3b/ed-fi/students/a0df76bba8212ea9b1a20c29591e940045dec9d65ee89603c31f0830',
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Act
    await getResolver(event, context);
  });

  afterAll(() => {
    mockGetById.mockRestore();
    mockList.mockRestore();
    mockQuery.mockRestore();
  });

  it('called getById', () => {
    expect(mockGetById).toHaveBeenCalled();
  });

  it('did not call list or query', () => {
    expect(mockList).not.toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('given a valid list request', () => {
  let mockGetById;
  let mockList;
  let mockQuery;

  beforeAll(async () => {
    mockGetById = jest.spyOn(GetResolvers, 'getById').mockImplementation((() => null) as any);
    mockList = jest.spyOn(GetResolvers, 'list').mockImplementation((() => null) as any);
    mockQuery = jest.spyOn(GetResolvers, 'query').mockImplementation((() => null) as any);

    const event: APIGatewayProxyEvent = {
      body: '',
      headers: '',
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path: '/v3.3b/ed-fi/students',
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Act
    await getResolver(event, context);
  });

  afterAll(() => {
    mockGetById.mockRestore();
    mockList.mockRestore();
    mockQuery.mockRestore();
  });

  it('called query', () => {
    expect(mockQuery).toHaveBeenCalled();
  });

  it('did not call getById or list', () => {
    expect(mockGetById).not.toHaveBeenCalled();
    expect(mockList).not.toHaveBeenCalled();
  });
});

describe('given a valid query request', () => {
  let mockGetById;
  let mockList;
  let mockQuery;

  beforeAll(async () => {
    mockGetById = jest.spyOn(GetResolvers, 'getById').mockImplementation((() => null) as any);
    mockList = jest.spyOn(GetResolvers, 'list').mockImplementation((() => null) as any);
    mockQuery = jest.spyOn(GetResolvers, 'query').mockImplementation((() => null) as any);

    const event: APIGatewayProxyEvent = {
      body: '',
      headers: '',
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path: '/v3.3b/ed-fi/students/',
      queryStringParameters: { lastSurname: 'World' },
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Act
    await getResolver(event, context);
  });

  afterAll(() => {
    mockGetById.mockRestore();
    mockList.mockRestore();
    mockQuery.mockRestore();
  });

  it('called query', () => {
    expect(mockQuery).toHaveBeenCalled();
  });

  it('did not call getById or list', () => {
    expect(mockGetById).not.toHaveBeenCalled();
    expect(mockList).not.toHaveBeenCalled();
  });
});
