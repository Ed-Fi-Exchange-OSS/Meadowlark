// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { FastifyInstance, InjectOptions } from 'fastify';
import * as AuthorizationServer from '@edfi/meadowlark-authz-server';
import * as MeadowlarkConnection from '../../src/handler/MeadowlarkConnection';
import { buildService } from '../../src/Service';
import { setupMockConfiguration } from '../ConfigHelper';

const verifyTokenRequest: InjectOptions = {
  method: 'POST',
  url: '/local/oauth/verify',
  headers: { authorization: 'bearer 1234', 'content-type': 'application/x-www-form-urlencoded' },
  payload: 'token=1234',
};

describe('given a POST to verify a token', () => {
  let mockVerify: any;
  let service: FastifyInstance;

  beforeAll(async () => {
    setupMockConfiguration();
    mockVerify = jest.spyOn(AuthorizationServer, 'verifyToken');
    jest.spyOn(MeadowlarkConnection, 'closeMeadowlarkConnection').mockResolvedValue();
    service = buildService();
    await service.ready();

    // Act
    await service.inject(verifyTokenRequest);
  });

  afterAll(async () => {
    await service.close();
    jest.restoreAllMocks();
  });

  it('should send the expected AuthorizationRequest to Authorization Server', async () => {
    expect(mockVerify.mock.calls).toHaveLength(1);
    const mock = mockVerify.mock.calls[0][0];

    expect(mock.body).toMatchInlineSnapshot(`"token=1234"`);
    expect(mock.headers.authorization).toBe('bearer 1234');
    expect(mock.headers['content-type']).toBe('application/x-www-form-urlencoded');
    expect(mock.path).toBe('/oauth/verify');
    expect(mock.queryParameters).toEqual({});
  });
});
