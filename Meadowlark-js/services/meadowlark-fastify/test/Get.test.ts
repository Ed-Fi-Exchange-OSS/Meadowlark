// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { FastifyInstance, InjectOptions } from 'fastify';
import * as MeadowlarkCore from '@edfi/meadowlark-core';
import { Config, initializeLogging } from '@edfi/meadowlark-utilities';
import { buildService } from '../src/Service';

jest.setTimeout(40000);

initializeLogging();
Config.set('OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST', 'https://example.com/a/b/c');

describe('given a GET of a school by id', () => {
  const schoolGetByIdRequest: InjectOptions = {
    method: 'GET',
    url: '/local/v3.3b/ed-fi/schools/1',
    headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
  };

  let mockGet: any;
  let service: FastifyInstance;

  beforeAll(async () => {
    mockGet = jest.spyOn(MeadowlarkCore, 'get');
    service = buildService();
    await service.ready();

    // Act
    await service.inject(schoolGetByIdRequest);
  });

  afterAll(async () => {
    await service.close();
    mockGet.mockRestore();
  });

  it('should send the expected FrontendRequest to Meadowlark', async () => {
    expect(mockGet.mock.calls).toHaveLength(1);
    const mock = mockGet.mock.calls[0][0];

    expect(mock.body).toBeNull();
    expect(mock.headers.authorization).toBe('bearer 1234');
    expect(mock.path).toBe('/v3.3b/ed-fi/schools/1');
    expect(mock.queryParameters).toEqual({});
  });
});

describe('given a GET of a school query without path ending slash', () => {
  const schoolQueryRequest: InjectOptions = {
    method: 'GET',
    url: '/local/v3.3b/ed-fi/schools?schoolId=123',
    headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
  };

  let mockGet: any;
  let service: FastifyInstance;

  beforeAll(async () => {
    mockGet = jest.spyOn(MeadowlarkCore, 'get');
    service = buildService();
    await service.ready();

    // Act
    await service.inject(schoolQueryRequest);
  });

  afterAll(async () => {
    await service.close();
    mockGet.mockRestore();
  });

  it('should send the expected FrontendRequest to Meadowlark', async () => {
    expect(mockGet.mock.calls).toHaveLength(1);
    const mock = mockGet.mock.calls[0][0];

    expect(mock.body).toBeNull();
    expect(mock.headers.authorization).toBe('bearer 1234');
    expect(mock.path).toBe('/v3.3b/ed-fi/schools');
    expect(mock.queryParameters).toMatchInlineSnapshot(`
      {
        "schoolId": "123",
      }
    `);
  });
});

describe('given a GET of a school query with path ending slash', () => {
  const schoolQueryRequest: InjectOptions = {
    method: 'GET',
    url: '/local/v3.3b/ed-fi/schools/?schoolId=123',
    headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
  };

  let mockGet: any;
  let service: FastifyInstance;

  beforeAll(async () => {
    mockGet = jest.spyOn(MeadowlarkCore, 'get');
    service = buildService();
    await service.ready();

    // Act
    await service.inject(schoolQueryRequest);
  });

  afterAll(async () => {
    await service.close();
    mockGet.mockRestore();
  });

  it('should send the expected FrontendRequest to Meadowlark', async () => {
    expect(mockGet.mock.calls).toHaveLength(1);
    const mock = mockGet.mock.calls[0][0];

    expect(mock.body).toBeNull();
    expect(mock.headers.authorization).toBe('bearer 1234');
    expect(mock.path).toBe('/v3.3b/ed-fi/schools/');
    expect(mock.queryParameters).toMatchInlineSnapshot(`
      {
        "schoolId": "123",
      }
    `);
  });
});
