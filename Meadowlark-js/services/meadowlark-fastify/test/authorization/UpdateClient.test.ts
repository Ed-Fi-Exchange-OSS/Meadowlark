// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { FastifyInstance, InjectOptions } from 'fastify';
import * as AuthorizationServer from '@edfi/meadowlark-authz-server';
import * as MeadowlarkConnection from '../../src/handler/MeadowlarkConnection';
import { buildService } from '../../src/Service';
import { setupMockConfiguration } from '../ConfigHelper';

const updateClientRequest: InjectOptions = {
  method: 'PUT',
  url: '/local/oauth/clients/890',
  headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
  payload: `{
    "clientName": "Hometown SIS",
    "roles": [
      "vendor",
      "assessment"
    ]
  }`,
};

describe('given a PUT to update a new client', () => {
  let mockUpsert: any;
  let service: FastifyInstance;

  beforeAll(async () => {
    setupMockConfiguration();
    mockUpsert = jest.spyOn(AuthorizationServer, 'updateClient');
    jest.spyOn(MeadowlarkConnection, 'closeMeadowlarkConnection').mockResolvedValue();
    service = buildService();
    await service.ready();

    // Act
    await service.inject(updateClientRequest);
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
          "clientName": "Hometown SIS",
          "roles": [
            "vendor",
            "assessment"
          ]
        }"
    `);
    expect(mock.headers.authorization).toBe('bearer 1234');
    expect(mock.path).toBe('/oauth/clients/890');
    expect(mock.queryParameters).toEqual({});
  });
});
