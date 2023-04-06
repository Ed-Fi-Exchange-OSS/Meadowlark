// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { FastifyInstance, InjectOptions } from 'fastify';
import * as MeadowlarkCore from '@edfi/meadowlark-core';
import { initializeLogging } from '@edfi/meadowlark-utilities';
import { newFrontendResponseSuccess } from '@edfi/meadowlark-core';
import * as MeadowlarkConnection from '../src/handler/MeadowlarkConnection';
import { buildService } from '../src/Service';
import { setupMockConfiguration } from './ConfigHelper';

describe('given a GET', () => {
  let mockGet: any;
  let service: FastifyInstance;

  beforeAll(async () => {
    setupMockConfiguration();
    initializeLogging();

    service = buildService();
    mockGet = jest.spyOn(MeadowlarkCore, 'get').mockResolvedValue(newFrontendResponseSuccess());
    jest.spyOn(MeadowlarkConnection, 'closeMeadowlarkConnection').mockResolvedValue();

    await service.ready();
  });

  afterEach(() => {
    mockGet.mockClear();
  });

  afterAll(async () => {
    await service.close();
    jest.restoreAllMocks();
  });

  describe('given a school by id', () => {
    const schoolGetByIdRequest: InjectOptions = {
      method: 'GET',
      url: '/local/v3.3b/ed-fi/schools/1',
      headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
    };

    beforeAll(async () => {
      // Act
      await service.inject(schoolGetByIdRequest);
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

  describe('given a school query without path ending slash', () => {
    const schoolQueryRequest: InjectOptions = {
      method: 'GET',
      url: '/local/v3.3b/ed-fi/schools?schoolId=123',
      headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
    };

    beforeAll(async () => {
      // Act
      await service.inject(schoolQueryRequest);
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

  describe('given a school query with path ending slash', () => {
    const schoolQueryRequest: InjectOptions = {
      method: 'GET',
      url: '/local/v3.3b/ed-fi/schools/?schoolId=123',
      headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
    };

    beforeAll(async () => {
      // Act
      await service.inject(schoolQueryRequest);
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
});
