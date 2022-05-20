// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as GetById from '../../src/handler/GetById';
import * as Query from '../../src/handler/Query';
import { getResolver } from '../../src/handler/Get';
import { FrontendRequest } from '../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../src/handler/FrontendResponse';

process.env.ACCESS_TOKEN_REQUIRED = 'false';

describe('given a missing resource path', () => {
  let response: FrontendResponse;

  beforeAll(async () => {
    const event: FrontendRequest = {
      body: '',
      headers: {},
      traceId: 'ApiGatewayRequestId',
      pathParameters: {},
      queryStringParameters: {},
      stage: '',
      path: '',
    };

    // Act
    response = await getResolver(event);
  }, 6000);

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns no error message', () => {
    expect(response.body).toEqual('');
  });
});

describe('given a path with only a version', () => {
  let response: FrontendResponse;

  beforeAll(async () => {
    const event: FrontendRequest = {
      body: '',
      headers: {},
      traceId: 'ApiGatewayRequestId',
      pathParameters: {},
      queryStringParameters: {},
      stage: '',
      path: '/v3.3b',
    };

    // Act
    response = await getResolver(event);
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns no error message', () => {
    expect(response.body).toEqual('');
  });
});

describe('given a path with version and namespace', () => {
  let response: FrontendResponse;

  beforeAll(async () => {
    const event: FrontendRequest = {
      body: '',
      headers: {},
      traceId: 'ApiGatewayRequestId',
      pathParameters: {},
      queryStringParameters: {},
      stage: '',
      path: '/v3.3b/ed-fi',
    };

    // Act
    response = await getResolver(event);
  });

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns no error message', () => {
    expect(response.body).toEqual('');
  });
});

describe('given requesting abstract classes by id', () => {
  const response: FrontendResponse[] = [];

  beforeAll(async () => {
    const event: FrontendRequest = {
      body: '',
      headers: { 'reference-validation': 'false' },
      traceId: 'ApiGatewayRequestId',
      pathParameters: {},
      queryStringParameters: {},
      stage: '',
      path: 'local/v3.3b/ed-fi/educationOrganizations/a0df76bba8212ea9b1a20c29591e940045dec9d65ee89603c31f0830',
    };

    // Act
    response[0] = await getResolver(event);

    event.path =
      'local/v3.3b/ed-fi/GeneralStudentProgramAssociations/a0df76bba8212ea9b1a20c29591e940045dec9d65ee89603c31f0830';
    response[1] = await getResolver(event);
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
  const response: FrontendResponse[] = [];

  beforeAll(async () => {
    const event: FrontendRequest = {
      body: '',
      headers: { 'reference-validation': 'false' },
      traceId: 'ApiGatewayRequestId',
      pathParameters: {},
      queryStringParameters: {},
      stage: '',
      path: 'local/v3.3b/ed-fi/educationOrganizations',
    };

    // Act
    response[0] = await getResolver(event);

    event.path = 'local/v3.3b/ed-fi/GeneralStudentProgramAssociations';
    response[1] = await getResolver(event);
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
  let mockQuery;

  beforeAll(async () => {
    mockGetById = jest.spyOn(GetById, 'getById').mockImplementation(() => null as any);
    mockQuery = jest.spyOn(Query, 'query').mockImplementation(() => null as any);

    const event: FrontendRequest = {
      body: '',
      headers: {},
      traceId: 'ApiGatewayRequestId',
      pathParameters: {},
      queryStringParameters: {},
      stage: '',
      path: '/v3.3b/ed-fi/students/a0df76bba8212ea9b1a20c29591e940045dec9d65ee89603c31f0830',
    };

    // Act
    await getResolver(event);
  });

  afterAll(() => {
    mockGetById.mockRestore();
    mockQuery.mockRestore();
  });

  it('called getById', () => {
    expect(mockGetById).toHaveBeenCalled();
  });

  it('did not call list or query', () => {
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('given a valid query request', () => {
  let mockGetById;
  let mockQuery;

  beforeAll(async () => {
    mockGetById = jest.spyOn(GetById, 'getById').mockImplementation(() => null as any);
    mockQuery = jest.spyOn(Query, 'query').mockImplementation(() => null as any);

    const event: FrontendRequest = {
      body: '',
      headers: {},
      traceId: 'ApiGatewayRequestId',
      path: '/v3.3b/ed-fi/students/',
      queryStringParameters: { lastSurname: 'World' },
      pathParameters: {},
      stage: '',
    };

    // Act
    await getResolver(event);
  });

  afterAll(() => {
    mockGetById.mockRestore();
    mockQuery.mockRestore();
  });

  it('called query', () => {
    expect(mockQuery).toHaveBeenCalled();
  });

  it('did not call getById or list', () => {
    expect(mockGetById).not.toHaveBeenCalled();
  });
});
