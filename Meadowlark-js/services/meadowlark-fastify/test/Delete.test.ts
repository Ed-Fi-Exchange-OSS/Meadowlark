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

describe('given a DELETE of a school by id', () => {
  const schoolDeleteByIdRequest: InjectOptions = {
    method: 'DELETE',
    url: '/local/v3.3b/ed-fi/schools/1',
    headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
  };

  let mockDeleteIt: any;
  let service: FastifyInstance;

  beforeAll(async () => {
    setupMockConfiguration();
    initializeLogging();
    mockDeleteIt = jest.spyOn(MeadowlarkCore, 'deleteIt').mockResolvedValue(newFrontendResponseSuccess());
    jest.spyOn(MeadowlarkConnection, 'closeMeadowlarkConnection').mockResolvedValue();
    service = buildService();
    await service.ready();

    // Act
    await service.inject(schoolDeleteByIdRequest);
  });

  afterAll(async () => {
    await service.close();

    jest.restoreAllMocks();
  });

  it('should send the expected FrontendRequest to Meadowlark', async () => {
    expect(mockDeleteIt.mock.calls).toHaveLength(1);
    const mock = mockDeleteIt.mock.calls[0][0];

    expect(mock.body).toBeNull();
    expect(mock.headers.authorization).toBe('bearer 1234');
    expect(mock.path).toBe('/v3.3b/ed-fi/schools/1');
    expect(mock.queryParameters).toEqual({});
  });
});
