// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { deleteIt, FrontendResponse, upsert, get } from '@edfi/meadowlark-core';
import {
  schoolBodyClient1,
  schoolGetClient1,
  schoolDeleteClient1,
  configureEnvironmentForSystemTests,
  academicWeekBodyClient1,
  schoolDeleteClient2,
} from './SystemTestSetup';

let backendToTest;

(async () => {
  const plugin = process.env.DOCUMENT_STORE_PLUGIN ?? '@edfi/meadowlark-mongodb-backend';
  backendToTest = await import(plugin);
})();

jest.setTimeout(40000);
configureEnvironmentForSystemTests();

describe('given a DELETE of a non-existent school', () => {
  let client;
  let deleteResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.TestingSetup();

    // Act
    deleteResult = await deleteIt(schoolDeleteClient1());
  });

  afterAll(async () => {
    backendToTest.TestingTeardown(client);
    // Should be able to run the following in each afterAll, but with PostgreSQL if
    // the pool is nulled and recreated the next describe block will run before
    // teardown is complete, causing subsequent tests to fail because they can't connect to the DB
    // backendToTest.TearDownAndReleasePool(client);
  });

  it('should return not found from delete', async () => {
    expect(deleteResult.statusCode).toBe(404);
  });
});

describe('given a POST of a school by followed by a DELETE of the school', () => {
  let client;
  let deleteResult: FrontendResponse;
  let getResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.TestingSetup();

    await upsert(schoolBodyClient1());

    // Act
    deleteResult = await deleteIt(schoolDeleteClient1());
    getResult = await get(schoolGetClient1());
  });

  afterAll(async () => {
    backendToTest.TestingTeardown(client);
    // backendToTest.TearDownAndReleasePool(client);
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
  let client;
  let deleteResult: FrontendResponse;
  let getResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.TestingSetup();

    await upsert(schoolBodyClient1());

    // Act
    deleteResult = await deleteIt(schoolDeleteClient2());
    getResult = await get(schoolGetClient1());
  });

  afterAll(async () => {
    backendToTest.TestingTeardown(client);
    // backendToTest.TearDownAndReleasePool(client);
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
  let client;
  let deleteResult: FrontendResponse;
  let getResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.TestingSetup();

    await upsert(schoolBodyClient1());
    await upsert(academicWeekBodyClient1());

    // Act
    deleteResult = await deleteIt(schoolDeleteClient1());
    getResult = await get(schoolGetClient1());
  });

  afterAll(async () => {
    backendToTest.TearDownAndReleasePool(client);
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
