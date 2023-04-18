// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { FastifyInstance, InjectOptions } from 'fastify';
import * as AuthorizationServer from '@edfi/meadowlark-authz-server';
import * as MeadowlarkConnection from '../../src/handler/MeadowlarkConnection';
import { buildService } from '../../src/Service';
import { setupMockConfiguration } from '../ConfigHelper';

const requestTokenRequest: InjectOptions = {
  method: 'POST',
  url: '/local/oauth/token',
  headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
  payload: `{
    "grant_type": "client_credentials",
    "client_id": "Hometown SIS",
    "client_secret": "123456"
  }`,
};

describe('given a POST to request a new token', () => {
  let mockUpsert: any;
  let service: FastifyInstance;

  beforeAll(async () => {
    setupMockConfiguration();
    mockUpsert = jest.spyOn(AuthorizationServer, 'requestToken');
    jest.spyOn(MeadowlarkConnection, 'closeMeadowlarkConnection').mockResolvedValue();
    service = buildService();
    await service.ready();

    // Act
    await service.inject(requestTokenRequest);
  });

  afterAll(async () => {
    await service.close();
    jest.restoreAllMocks();
  });

  it('should send the expected AuthorizationRequest to Authorization Server', async () => {
    expect(mockUpsert.mock.calls).toHaveLength(1);
    const mock = mockUpsert.mock.calls[0][0];

    expect(mock.body).toMatchInlineSnapshot(`
      "{
          "grant_type": "client_credentials",
          "client_id": "Hometown SIS",
          "client_secret": "123456"
        }"
    `);
    expect(mock.headers.authorization).toBe('bearer 1234');
    expect(mock.path).toBe('/oauth/token');
    expect(mock.queryParameters).toEqual({});
  });
});
