// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { deleteIt, FrontendResponse, upsert, get, SystemTestClient } from '@edfi/meadowlark-core';
import {
  backendToTest,
  schoolDeleteClient1,
  academicWeekBodyClient1,
  schoolDeleteClient2,
  schoolBodyClient1,
  schoolGetClient1,
} from './SystemTestSetup';

jest.setTimeout(40000);

describe('given a POST of a school by followed by a DELETE of the school', () => {
  let client: SystemTestClient;
  let deleteResult: FrontendResponse;
  let getResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(schoolBodyClient1());

    // Act
    deleteResult = await deleteIt(schoolDeleteClient1());
    getResult = await get(schoolGetClient1());
  });

  afterAll(async () => {
    await backendToTest.systemTestTeardown(client);
  });

  it('should return delete success', async () => {
    expect(deleteResult.body).toEqual('');
    expect(deleteResult.statusCode).toBe(204);
  });

  it('should return not found from get', async () => {
    expect(getResult.statusCode).toBe(404);
  });
});

describe('given a POST of a school by one client followed by a DELETE of the school by a second client', () => {
  let client: SystemTestClient;
  let deleteResult: FrontendResponse;
  let getResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(schoolBodyClient1());

    // Act
    deleteResult = await deleteIt(schoolDeleteClient2());
    getResult = await get(schoolGetClient1());
  });

  afterAll(async () => {
    await backendToTest.systemTestTeardown(client);
  });

  it('should return delete from client 2 as a 403 forbidden', async () => {
    expect(deleteResult.body).toEqual('');
    expect(deleteResult.statusCode).toBe(403);
  });

  it('should return successful get from client 1', async () => {
    expect(getResult.statusCode).toBe(200);
  });
});

describe('given the DELETE of a school referenced by an academic week', () => {
  let client: SystemTestClient;
  let deleteResult: FrontendResponse;
  let getResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(schoolBodyClient1());
    await upsert(academicWeekBodyClient1());

    // Act
    deleteResult = await deleteIt(schoolDeleteClient1());
    getResult = await get(schoolGetClient1());
  });

  afterAll(async () => {
    await backendToTest.systemTestTeardown(client);
  });

  it('should return delete failure due to a reference to the school', async () => {
    expect(deleteResult.body).toMatchInlineSnapshot(
      `"{\\"message\\":\\"Delete failed due to existing references to document: Resource AcademicWeek with identity '[{\\\\\\"name\\\\\\":\\\\\\"schoolReference.schoolId\\\\\\",\\\\\\"value\\\\\\":123},{\\\\\\"name\\\\\\":\\\\\\"weekIdentifier\\\\\\",\\\\\\"value\\\\\\":\\\\\\"1st\\\\\\"}]'\\"}"`,
    );
    expect(deleteResult.statusCode).toBe(409);
  });

  it('should return still found from get', async () => {
    expect(getResult.statusCode).toBe(200);
  });
});

describe('given a DELETE of a non-existent school', () => {
  let client: SystemTestClient;
  let deleteResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    // Act
    deleteResult = await deleteIt(schoolDeleteClient1());
  });

  afterAll(async () => {
    await backendToTest.systemTestTeardown(client);
  });

  it('should return not found from delete', async () => {
    expect(deleteResult.statusCode).toBe(404);
  });
});
