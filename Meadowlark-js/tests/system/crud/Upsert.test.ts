// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, FrontendResponse, get, newFrontendRequest, upsert } from '@edfi/meadowlark-core';
import { getNewClient, getCollection, resetSharedClient } from '@edfi/meadowlark-mongodb-backend';
import { MongoClient } from 'mongodb';

jest.setTimeout(40000);
process.env.DOCUMENT_STORE_PLUGIN = '@edfi/meadowlark-mongodb-backend';
process.env.SIGNING_KEY =
  'v/AbsYGRvIfCf1bxufA6+Ras5NR+kIroLUg5RKYMjmqvNa1fVanmPBXKFH+MD1TPHpSgna0g+6oRnmRGUme6vJ7x91OA7Lp1hWzr6NnpdLYA9BmDHWjkRFvlx9bVmP+GTave2E4RAYa5b/qlvXOVnwaqEWzHxefqzkd1F1mQ6dVNFWYdiOmgw8ofQ87Xi1W0DkToRNS/Roc4rxby/BZwHUj7Y4tYdMpkWDMrZK6Vwat1KuPyiqsaBQYa9Xd0pxKqUOrAp8a+BFwiPfxf4nyVdOSAd77A/wuKIJaERNY5xJXUHwNgEOMf+Lg4032u4PnsnH7aJb2F4z8AhHldM6w5jw==';

const headers = {
  Authorization:
    'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlZC1maS1tZWFkb3dsYXJrIiwiYXVkIjoibWVhZG93bGFyayIsInN1YiI6InN1cGVyLWdyZWF0LVNJUyIsImp0aSI6IjNkNTliNzVmLWE3NjItNGJhYS05MTE2LTE5YzgyZmRmOGRlMyIsImlhdCI6MTYzNjU2MjA2MCwiZXhwIjozODQ1NTQ4ODgxfQ.WF5ABFZAvNsLDZktwa8VxDR846fGptRXJObtQitbL8I',
};

export function newFrontendRequestTemplate(): FrontendRequest {
  return {
    ...newFrontendRequest(),
    headers,
    stage: 'local',
  };
}

describe('given a POST of a school followed by the GET of the created school', () => {
  let client: MongoClient;
  let upsertResult: FrontendResponse;
  let getResult: FrontendResponse;

  const postSchool: FrontendRequest = {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/schools',
    body: `{
      "schoolId": 123,
      "gradeLevels": [],
      "nameOfInstitution": "abc",
      "educationOrganizationCategories": []
    }`,
  };

  const getSchool: FrontendRequest = {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/schools/8d111d14579c51e8aff915e7746cda7e0730ed74837af960b31c4fa6',
  };

  beforeAll(async () => {
    client = (await getNewClient()) as MongoClient;
    await getCollection(client).deleteMany({});

    // Act
    upsertResult = await upsert(postSchool);
    getResult = await get(getSchool);
  });

  afterAll(async () => {
    await getCollection(client).deleteMany({});
    await client.close();
    await resetSharedClient();
  });

  it('should return insert success', async () => {
    expect(upsertResult.statusCode).toBe(201);
  });

  it('should return get success', async () => {
    expect(getResult.statusCode).toBe(200);
  });
});
