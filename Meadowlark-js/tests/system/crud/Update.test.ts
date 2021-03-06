// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, FrontendResponse, get, upsert, update, SystemTestClient } from '@edfi/meadowlark-core';
import {
  backendToTest,
  CLIENT1_HEADERS,
  schoolBodyClient1,
  newFrontendRequestTemplate,
  schoolGetClient1,
  CLIENT2_HEADERS,
} from './SystemTestSetup';

jest.setTimeout(40000);

describe('given a POST of a school followed by the PUT of the school with a changed field', () => {
  let client: SystemTestClient;
  let updateResult: FrontendResponse;

  const putSchoolChangeNameOfInstitution: FrontendRequest = {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/schools/L9gXuk9vioIoG64QKp8NFO2f3AOe78fV-HrtfQ',
    headers: CLIENT1_HEADERS,
    body: `{
      "schoolId": 123,
      "gradeLevels": [],
      "nameOfInstitution": "abcdefghijklmnopqrstuvwxyz",
      "educationOrganizationCategories": []
    }`,
  };

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(schoolBodyClient1());
    // Act
    updateResult = await update(putSchoolChangeNameOfInstitution);
  });

  afterAll(async () => {
    backendToTest.systemTestTeardown(client);
  });

  it('should return put success', async () => {
    expect(updateResult.body).toEqual('');
    expect(updateResult.statusCode).toBe(204);
    expect(updateResult.headers?.Location).toMatchInlineSnapshot(`undefined`);
  });

  it('should return get with updated nameOfInstitution', async () => {
    const getResult: FrontendResponse = await get(schoolGetClient1());
    expect(getResult.body).toMatchInlineSnapshot(
      `"{\\"id\\":\\"L9gXuk9vioIoG64QKp8NFO2f3AOe78fV-HrtfQ\\",\\"schoolId\\":123,\\"gradeLevels\\":[],\\"nameOfInstitution\\":\\"abcdefghijklmnopqrstuvwxyz\\",\\"educationOrganizationCategories\\":[]}"`,
    );
    expect(getResult.statusCode).toBe(200);
  });
});

describe('given a POST of a school followed by the PUT with an empty body', () => {
  let client: SystemTestClient;
  let updateResult: FrontendResponse;

  const putSchoolEmptyBody: FrontendRequest = {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/schools/L9gXuk9vioIoG64QKp8NFO2f3AOe78fV-HrtfQ',
    headers: CLIENT1_HEADERS,
    body: '{}',
  };

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(schoolBodyClient1());
    // Act
    updateResult = await update(putSchoolEmptyBody);
  });

  afterAll(async () => {
    backendToTest.systemTestTeardown(client);
  });

  it('should return put failure', async () => {
    expect(updateResult.body).toMatchInlineSnapshot(
      `"{\\"message\\":[\\"schoolId is required\\",\\"gradeLevels is required\\",\\"nameOfInstitution is required\\",\\"educationOrganizationCategories is required\\"]}"`,
    );
    expect(updateResult.statusCode).toBe(400);
  });
});

describe('given a POST of a school followed by the PUT of the school with a different identity', () => {
  let client: SystemTestClient;
  let updateResult: FrontendResponse;

  const putSchoolWrongIdentity: FrontendRequest = {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/schools/L9gXuk9vioIoG64QKp8NFO2f3AOe78fV-HrtfQ',
    headers: CLIENT1_HEADERS,
    body: `{
      "schoolId": 789,
      "gradeLevels": [],
      "nameOfInstitution": "abc",
      "educationOrganizationCategories": []
    }`,
  };

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(schoolBodyClient1());
    // Act
    updateResult = await update(putSchoolWrongIdentity);
  });

  afterAll(async () => {
    backendToTest.systemTestTeardown(client);
  });

  it('should return put failure', async () => {
    expect(updateResult.body).toMatchInlineSnapshot(
      `"{\\"message\\":\\"The identity of the resource does not match the identity in the updated document.\\"}"`,
    );
    expect(updateResult.statusCode).toBe(400);
  });
});

describe('given a POST of a school by one client followed by a PUT of the school by a second client', () => {
  let client: SystemTestClient;
  let updateResult: FrontendResponse;

  const putSchoolChangeClient2: FrontendRequest = {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/schools/L9gXuk9vioIoG64QKp8NFO2f3AOe78fV-HrtfQ',
    headers: CLIENT2_HEADERS,
    body: `{
      "schoolId": 123,
      "gradeLevels": [],
      "nameOfInstitution": "abcdefghijklmnopqrstuvwxyz",
      "educationOrganizationCategories": []
    }`,
  };

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(schoolBodyClient1());

    // Act
    updateResult = await upsert(putSchoolChangeClient2);
  });

  afterAll(async () => {
    backendToTest.systemTestTeardown(client);
  });

  it('should return put as a 403 forbidden', async () => {
    expect(updateResult.body).toEqual('');
    expect(updateResult.statusCode).toBe(403);
  });
});

describe('given a POST of a school followed by a PUT adding a reference to an invalid descriptor', () => {
  let client: SystemTestClient;
  let updateResult: FrontendResponse;

  const putSchoolInvalidDescriptor: FrontendRequest = {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/schools/L9gXuk9vioIoG64QKp8NFO2f3AOe78fV-HrtfQ',
    headers: CLIENT1_HEADERS,
    body: `{
      "schoolId": 123,
      "gradeLevels": [],
      "nameOfInstitution": "abc",
      "educationOrganizationCategories": [],
      "internetAccessDescriptor": "invalid"
    }`,
  };

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(schoolBodyClient1());

    // Act
    updateResult = await update(putSchoolInvalidDescriptor);
  });

  afterAll(async () => {
    backendToTest.systemTestTeardown(client);
  });

  it('should return failure due to missing descriptor', async () => {
    expect(updateResult.body).toMatchInlineSnapshot(
      `"{\\"message\\":\\"Reference validation failed: Resource InternetAccessDescriptor is missing identity [{\\\\\\"name\\\\\\":\\\\\\"descriptor\\\\\\",\\\\\\"value\\\\\\":\\\\\\"invalid\\\\\\"}]\\"}"`,
    );
    expect(updateResult.statusCode).toBe(400);
  });
});
