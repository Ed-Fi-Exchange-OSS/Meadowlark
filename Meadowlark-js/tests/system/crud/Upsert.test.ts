// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, FrontendResponse, get, upsert } from '@edfi/meadowlark-core';
import { getNewClient, getCollection, resetSharedClient } from '@edfi/meadowlark-mongodb-backend';
import { MongoClient } from 'mongodb';
import {
  CLIENT1_HEADERS,
  schoolBodyClient1,
  newFrontendRequestTemplate,
  schoolGetClient1,
  academicWeekBodyClient1,
  schoolBodyClient2,
  configureEnvironmentForMongoSystemTests,
} from './SystemTestSetup';

jest.setTimeout(40000);
configureEnvironmentForMongoSystemTests();

describe('given a POST of a school', () => {
  let client: MongoClient;
  let upsertResult: FrontendResponse;

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    await getCollection(client).deleteMany({});

    // Act
    upsertResult = await upsert(schoolBodyClient1());
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
    await resetSharedClient();
  });

  it('should return insert success', async () => {
    expect(upsertResult.body).toEqual('');
    expect(upsertResult.statusCode).toBe(201);
    expect(upsertResult.headers?.Location).toMatchInlineSnapshot(
      `"/v3.3b/ed-fi/schools/x1GptgyYapmpBGiZegIbM2XC_NLMVVjisNLEtg"`,
    );
  });

  it('should return get success', async () => {
    const getResult = await get(schoolGetClient1());
    expect(getResult.body).toMatchInlineSnapshot(
      `"{\\"id\\":\\"x1GptgyYapmpBGiZegIbM2XC_NLMVVjisNLEtg\\",\\"schoolId\\":123,\\"gradeLevels\\":[],\\"nameOfInstitution\\":\\"abc\\",\\"educationOrganizationCategories\\":[]}"`,
    );
    expect(getResult.statusCode).toBe(200);
  });
});

describe('given a POST of a school with an empty body', () => {
  let client: MongoClient;
  let upsertResult: FrontendResponse;

  const schoolEmptyBody: FrontendRequest = {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/schools',
    headers: CLIENT1_HEADERS,
    body: '{}',
  };

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    await getCollection(client).deleteMany({});

    // Act
    upsertResult = await upsert(schoolEmptyBody);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
    await resetSharedClient();
  });

  it('should return insert failure', async () => {
    expect(upsertResult.body).toMatchInlineSnapshot(
      `"{\\"message\\":[\\"schoolId is required\\",\\"gradeLevels is required\\",\\"nameOfInstitution is required\\",\\"educationOrganizationCategories is required\\"]}"`,
    );
    expect(upsertResult.statusCode).toBe(400);
  });
});

describe('given a POST of a school followed by a second POST of the school with a changed field', () => {
  let client: MongoClient;
  let firstUpsertResult: FrontendResponse;
  let secondUpsertResult: FrontendResponse;

  const schoolChangeNameOfInstitutionClient1: FrontendRequest = {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/schools',
    headers: CLIENT1_HEADERS,
    body: `{
        "schoolId": 123,
        "gradeLevels": [],
        "nameOfInstitution": "abcdefghijklmnopqrstuvwxyz",
        "educationOrganizationCategories": []
      }`,
  };

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    await getCollection(client).deleteMany({});

    // Act
    firstUpsertResult = await upsert(schoolBodyClient1());
    secondUpsertResult = await upsert(schoolChangeNameOfInstitutionClient1);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
    await resetSharedClient();
  });

  it('should return 1st post 201 as an insert', async () => {
    expect(firstUpsertResult.body).toEqual('');
    expect(firstUpsertResult.statusCode).toBe(201);
  });

  it('should return 2nd post 200 as an update', async () => {
    expect(secondUpsertResult.body).toEqual('');
    expect(secondUpsertResult.statusCode).toBe(200);
  });

  it('should return get with updated nameOfInstitution', async () => {
    const getResult: FrontendResponse = await get(schoolGetClient1());
    expect(getResult.body).toMatchInlineSnapshot(
      `"{\\"id\\":\\"x1GptgyYapmpBGiZegIbM2XC_NLMVVjisNLEtg\\",\\"schoolId\\":123,\\"gradeLevels\\":[],\\"nameOfInstitution\\":\\"abcdefghijklmnopqrstuvwxyz\\",\\"educationOrganizationCategories\\":[]}"`,
    );
    expect(getResult.statusCode).toBe(200);
  });
});

describe('given a POST of an academic week referencing a school that does not exist', () => {
  let client: MongoClient;
  let upsertResult: FrontendResponse;

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    await getCollection(client).deleteMany({});

    // Act
    upsertResult = await upsert(academicWeekBodyClient1());
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
    await resetSharedClient();
  });

  it('should return failure due to missing reference', async () => {
    expect(upsertResult.body).toMatchInlineSnapshot(
      `"{\\"message\\":\\"Reference validation failed: Resource School is missing identity [{\\\\\\"name\\\\\\":\\\\\\"educationOrganizationId\\\\\\",\\\\\\"value\\\\\\":123}]\\"}"`,
    );
    expect(upsertResult.statusCode).toBe(400);
  });
});

describe('given a POST of an academic week referencing a school that exists', () => {
  let client: MongoClient;
  let upsertResult: FrontendResponse;

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    await getCollection(client).deleteMany({});

    await upsert(schoolBodyClient1());

    // Act
    upsertResult = await upsert(academicWeekBodyClient1());
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
    await resetSharedClient();
  });

  it('should return success', async () => {
    expect(upsertResult.body).toEqual('');
    expect(upsertResult.statusCode).toBe(201);
    expect(upsertResult.headers?.Location).toMatchInlineSnapshot(
      `"/v3.3b/ed-fi/academicWeeks/t4JWTsagjhY4Ea-oIcXCeS7oqbNX9iWfPx6e-g"`,
    );
  });
});

describe('given a POST of an academic week referencing a school that exists followed by a second POST changing to reference a missing school', () => {
  let client: MongoClient;
  let upsertResult: FrontendResponse;

  const academicWeekWithMissingSchool: FrontendRequest = {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/academicWeeks',
    headers: CLIENT1_HEADERS,
    body: `{
      "schoolReference": {
          "schoolId": 999
      },
      "weekIdentifier": "1st",
      "beginDate": "2022-12-01",
      "endDate": "2022-12-31",
      "totalInstructionalDays": 30
    }`,
  };

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    await getCollection(client).deleteMany({});

    await upsert(schoolBodyClient1());
    await upsert(academicWeekBodyClient1());

    // Act
    upsertResult = await upsert(academicWeekWithMissingSchool);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
    await resetSharedClient();
  });

  it('should return failure due to missing reference', async () => {
    expect(upsertResult.body).toMatchInlineSnapshot(
      `"{\\"message\\":\\"Reference validation failed: Resource School is missing identity [{\\\\\\"name\\\\\\":\\\\\\"educationOrganizationId\\\\\\",\\\\\\"value\\\\\\":999}]\\"}"`,
    );
    expect(upsertResult.statusCode).toBe(400);
  });
});

describe('given a POST of a school by one client followed by a second POST of the school by a second client', () => {
  let client: MongoClient;
  let firstUpsertResult: FrontendResponse;
  let secondUpsertResult: FrontendResponse;

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    await getCollection(client).deleteMany({});

    // Act
    firstUpsertResult = await upsert(schoolBodyClient1());
    secondUpsertResult = await upsert(schoolBodyClient2());
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
    await resetSharedClient();
  });

  it('should return 1st post 201 as an insert', async () => {
    expect(firstUpsertResult.body).toEqual('');
    expect(firstUpsertResult.statusCode).toBe(201);
  });

  it('should return 2nd post as a 403 forbidden', async () => {
    expect(secondUpsertResult.body).toEqual('');
    expect(secondUpsertResult.statusCode).toBe(403);
  });
});
