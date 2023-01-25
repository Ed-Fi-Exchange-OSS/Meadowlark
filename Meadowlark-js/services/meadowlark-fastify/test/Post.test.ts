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

const schoolPostRequest: InjectOptions = {
  method: 'POST',
  url: '/local/v3.3b/ed-fi/schools',
  headers: { authorization: 'bearer 1234', 'content-type': 'application/json' },
  payload: `{
    "schoolId": 123,
    "gradeLevels": [],
    "nameOfInstitution": "abc",
    "educationOrganizationCategories": []
  }`,
};

describe('given a POST of a school', () => {
  let mockUpsert: any;
  let service: FastifyInstance;

  beforeAll(async () => {
    mockUpsert = jest.spyOn(MeadowlarkCore, 'upsert');
    service = buildService();
    await service.ready();

    // Act
    await service.inject(schoolPostRequest);
  });

  afterAll(async () => {
    await service.close();
    mockUpsert.mockRestore();
  });

  it('should send the expected FrontendRequest to Meadowlark', async () => {
    expect(mockUpsert.mock.calls).toHaveLength(1);
    const mock = mockUpsert.mock.calls[0][0];

    expect(mock.body).toMatchInlineSnapshot(`
      "{
          "schoolId": 123,
          "gradeLevels": [],
          "nameOfInstitution": "abc",
          "educationOrganizationCategories": []
        }"
    `);
    expect(mock.headers.authorization).toBe('bearer 1234');
    expect(mock.path).toBe('/v3.3b/ed-fi/schools');
    expect(mock.queryParameters).toEqual({});
  });
});
