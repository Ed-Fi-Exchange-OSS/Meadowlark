// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, FrontendResponse, get, SystemTestClient, upsert } from '@edfi/meadowlark-core';
import {
  backendToTest,
  CLIENT1_HEADERS,
  schoolBodyClient1,
  newFrontendRequestTemplateClient1,
  schoolGetClient1,
  academicWeekBodyClient1,
  schoolBodyClient2,
  educationOrganizationCategoryDescriptorBody,
  gradeLevelDescriptorBody,
} from './SystemTestSetup';

jest.setTimeout(40000);

describe('given a POST of a school', () => {
  let client: SystemTestClient;
  let upsertResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(educationOrganizationCategoryDescriptorBody());
    await upsert(gradeLevelDescriptorBody());

    // Act
    upsertResult = await upsert(schoolBodyClient1());
  });

  afterAll(async () => {
    await backendToTest.systemTestTeardown(client);
  });

  it('should return insert success', async () => {
    expect(upsertResult.body).toEqual('');
    expect(upsertResult.statusCode).toBe(201);
    expect(upsertResult.headers?.Location).toMatchInlineSnapshot(
      `"/v3.3b/ed-fi/schools/LZRuhjvR1UiLz9Tat_4HOBmlPt_xB_pA20fKyQ"`,
    );
  });

  it('should return get success', async () => {
    const getResult = await get(schoolGetClient1());
    expect(getResult.body).toMatchInlineSnapshot(
      `"{"id":"LZRuhjvR1UiLz9Tat_4HOBmlPt_xB_pA20fKyQ","schoolId":123,"gradeLevels":[{"gradeLevelDescriptor":"uri://ed-fi.org/GradeLevelDescriptor#First Grade"}],"nameOfInstitution":"abc","educationOrganizationCategories":[{"educationOrganizationCategoryDescriptor":"uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other"}]}"`,
    );
    expect(getResult.statusCode).toBe(200);
  });
});

describe('given a POST of a school with an empty body', () => {
  let client: SystemTestClient;
  let upsertResult: FrontendResponse;

  const schoolEmptyBody: FrontendRequest = {
    ...newFrontendRequestTemplateClient1(),
    path: '/v3.3b/ed-fi/schools',
    headers: CLIENT1_HEADERS,
    body: '{}',
  };

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    // Act
    upsertResult = await upsert(schoolEmptyBody);
  });

  afterAll(async () => {
    await backendToTest.systemTestTeardown(client);
  });

  it('should return insert failure', async () => {
    expect(upsertResult.body).toMatchInlineSnapshot(
      `"{"message":[" must have required property 'schoolId'"," must have required property 'gradeLevels'"," must have required property 'nameOfInstitution'"," must have required property 'educationOrganizationCategories'"]}"`,
    );
    expect(upsertResult.statusCode).toBe(400);
  });
});

describe('given a POST of a school followed by a second POST of the school with a changed field', () => {
  let client: SystemTestClient;
  let firstUpsertResult: FrontendResponse;
  let secondUpsertResult: FrontendResponse;

  const schoolChangeNameOfInstitutionClient1: FrontendRequest = {
    ...newFrontendRequestTemplateClient1(),
    path: '/v3.3b/ed-fi/schools',
    headers: CLIENT1_HEADERS,
    body: `{
        "schoolId": 123,
        "gradeLevels": [
          {
              "gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#First Grade"
          }
        ],
        "nameOfInstitution": "abcdefghijklmnopqrstuvwxyz",
        "educationOrganizationCategories": [
          {
            "educationOrganizationCategoryDescriptor": "uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other"
          }
        ]
      }`,
  };

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(educationOrganizationCategoryDescriptorBody());
    await upsert(gradeLevelDescriptorBody());

    // Act
    firstUpsertResult = await upsert(schoolBodyClient1());
    secondUpsertResult = await upsert(schoolChangeNameOfInstitutionClient1);
  });

  afterAll(async () => {
    await backendToTest.systemTestTeardown(client);
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
      `"{"id":"LZRuhjvR1UiLz9Tat_4HOBmlPt_xB_pA20fKyQ","schoolId":123,"gradeLevels":[{"gradeLevelDescriptor":"uri://ed-fi.org/GradeLevelDescriptor#First Grade"}],"nameOfInstitution":"abcdefghijklmnopqrstuvwxyz","educationOrganizationCategories":[{"educationOrganizationCategoryDescriptor":"uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other"}]}"`,
    );
    expect(getResult.statusCode).toBe(200);
  });
});

describe('given a POST of an academic week referencing a school that does not exist', () => {
  let client: SystemTestClient;
  let upsertResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    // Act
    upsertResult = await upsert(academicWeekBodyClient1());
  });

  afterAll(async () => {
    await backendToTest.systemTestTeardown(client);
  });

  it('should return failure due to missing reference', async () => {
    expect(upsertResult.body).toMatchInlineSnapshot(
      `"{"message":"Reference validation failed: Resource School is missing identity {\\"schoolId\\":123}"}"`,
    );
    expect(upsertResult.statusCode).toBe(400);
  });
});

describe('given a POST of an academic week referencing a school that exists', () => {
  let client: SystemTestClient;
  let upsertResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(educationOrganizationCategoryDescriptorBody());
    await upsert(gradeLevelDescriptorBody());

    await upsert(schoolBodyClient1());

    // Act
    upsertResult = await upsert(academicWeekBodyClient1());
  });

  afterAll(async () => {
    await backendToTest.systemTestTeardown(client);
  });

  it('should return success', async () => {
    expect(upsertResult.body).toEqual('');
    expect(upsertResult.statusCode).toBe(201);
    expect(upsertResult.headers?.Location).toMatchInlineSnapshot(
      `"/v3.3b/ed-fi/academicWeeks/02pe_9hl1wM_jO1vMF1kvGV72yj2l2b8qNnnFg"`,
    );
  });
});

describe('given a POST of an academic week referencing a school that exists followed by a second POST changing to reference a missing school', () => {
  let client: SystemTestClient;
  let upsertResult: FrontendResponse;

  const academicWeekWithMissingSchool: FrontendRequest = {
    ...newFrontendRequestTemplateClient1(),
    path: '/v3.3b/ed-fi/academicWeeks',
    headers: CLIENT1_HEADERS,
    body: `{
      "schoolReference": {
          "schoolId": 999
      },
      "weekIdentifier": "1234567",
      "beginDate": "2022-12-01",
      "endDate": "2022-12-31",
      "totalInstructionalDays": 30
    }`,
  };

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(educationOrganizationCategoryDescriptorBody());
    await upsert(gradeLevelDescriptorBody());
    await upsert(schoolBodyClient1());
    await upsert(academicWeekBodyClient1());

    // Act
    upsertResult = await upsert(academicWeekWithMissingSchool);
  });

  afterAll(async () => {
    await backendToTest.systemTestTeardown(client);
  });

  it('should return failure due to missing reference', async () => {
    expect(upsertResult.body).toMatchInlineSnapshot(
      `"{"message":"Reference validation failed: Resource School is missing identity {\\"schoolId\\":999}"}"`,
    );
    expect(upsertResult.statusCode).toBe(400);
  });
});

describe('given a POST of a school by one client followed by a second POST of the school by a second client', () => {
  let client: SystemTestClient;
  let firstUpsertResult: FrontendResponse;
  let secondUpsertResult: FrontendResponse;

  beforeAll(async () => {
    client = await backendToTest.systemTestSetup();

    await upsert(educationOrganizationCategoryDescriptorBody());
    await upsert(gradeLevelDescriptorBody());

    // Act
    firstUpsertResult = await upsert(schoolBodyClient1());
    secondUpsertResult = await upsert(schoolBodyClient2());
  });

  afterAll(async () => {
    await backendToTest.systemTestTeardown(client);
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
