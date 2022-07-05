// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendResponse, get, SystemTestClient, upsert } from '@edfi/meadowlark-core';
import { backendToTest, schoolBodyClient1, schoolGetClient2, schoolGetClient1 } from './SystemTestSetup';

jest.setTimeout(40000);

describe('given a GET of a non-existent school', () => {
  let client: SystemTestClient;
  let getResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    // Act
    getResult = await get(schoolGetClient1());
  });

  afterAll(async () => {
    backendToTest.systemTestTeardown(client);
  });

  it('should return not found', async () => {
    expect(getResult.body).toEqual('');
    expect(getResult.statusCode).toBe(404);
  });
});

describe('given a POST of a school by one client followed by a GET of the school by a second client', () => {
  let client: SystemTestClient;
  let getResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(schoolBodyClient1());

    // Act
    getResult = await get(schoolGetClient2());
  });

  afterAll(async () => {
    backendToTest.systemTestTeardown(client);
  });

  it('should return get as a 403 forbidden', async () => {
    expect(getResult.body).toEqual('');
    expect(getResult.statusCode).toBe(403);
  });
});
