// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from 'fastify';
import * as AuthorizationServer from '@edfi/meadowlark-authz-server';
import { buildService } from '../../src/Service';

const getClientByIdRequest: InjectOptions = {
  method: 'GET',
  url: '/local/oauth/clients/890',
  headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
  payload: '',
};

const clientResponse: AuthorizationServer.AuthorizationResponse = {
  statusCode: 200,
  body: `{
  "clientId": "890",
  "clientName": "Hometown SIS",
  "roles": ["vendor", "assessment"],
  "active": true,
}`,
};

describe('given a GET by ID request', () => {
  let mockAuthServer: any;
  let service: FastifyInstance;
  let response: LightMyRequestResponse;

  beforeAll(async () => {
    mockAuthServer = jest.spyOn(AuthorizationServer, 'getClientById');
    mockAuthServer.mockReturnValue(clientResponse);
    service = buildService();
    await service.ready();

    // Act
    response = await service.inject(getClientByIdRequest);
  });

  afterAll(async () => {
    await service.close();
    mockAuthServer.mockRestore();
  });

  it('should respond with the appropriate Client ', async () => {
    expect(response.body).toMatchInlineSnapshot(`
      "{
        "clientId": "890",
        "clientName": "Hometown SIS",
        "roles": ["vendor", "assessment"],
        "active": true,
      }"
    `);
  });

  it('should call the authorization server correctly', async () => {
    expect(mockAuthServer.mock.calls).toHaveLength(1);
    const mock = mockAuthServer.mock.calls[0][0];

    expect(mock.body).toMatchInlineSnapshot(`null`);
    expect(mock.headers.authorization).toBe('bearer 1234');
    expect(mock.path).toBe('/oauth/clients/890');
    expect(mock.queryParameters).toEqual({});
  });
});
