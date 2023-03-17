// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from 'fastify';
import * as AuthorizationServer from '@edfi/meadowlark-authz-server';
import * as MeadowlarkConnection from '../../src/handler/MeadowlarkConnection';
import { buildService } from '../../src/Service';
import { setupMockConfiguration } from '../ConfigHelper';

const getClientRequest: InjectOptions = {
  method: 'GET',
  url: '/local/oauth/clients',
  headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
  payload: '',
};

const clientResponse: AuthorizationServer.AuthorizationResponse = {
  statusCode: 200,
  body: [
    {
      clientId: '890',
      clientName: 'Hometown SIS',
      roles: ['vendor', 'assessment'],
      active: true,
    },
  ],
};

describe('given a GET request', () => {
  let mockAuthServer: any;
  let service: FastifyInstance;
  let response: LightMyRequestResponse;

  beforeAll(async () => {
    setupMockConfiguration();
    mockAuthServer = jest.spyOn(AuthorizationServer, 'getClients').mockResolvedValue(clientResponse);
    jest.spyOn(MeadowlarkConnection, 'closeMeadowlarkConnection').mockResolvedValue();
    service = buildService();
    await service.ready();

    // Act
    response = await service.inject(getClientRequest);
  });

  afterAll(async () => {
    await service.close();
    jest.restoreAllMocks();
  });

  it('should respond with the appropriate clients', async () => {
    expect(response.body).toMatchInlineSnapshot(
      `"[{"clientId":"890","clientName":"Hometown SIS","roles":["vendor","assessment"],"active":true}]"`,
    );
  });

  it('should call the authorization server correctly', async () => {
    expect(mockAuthServer.mock.calls).toHaveLength(1);
    const mock = mockAuthServer.mock.calls[0][0];

    expect(mock.body).toMatchInlineSnapshot(`null`);
    expect(mock.headers.authorization).toBe('bearer 1234');
    expect(mock.path).toBe('/oauth/clients');
    expect(mock.queryParameters).toEqual({});
  });
});
