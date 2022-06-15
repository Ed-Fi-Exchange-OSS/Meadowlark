// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, newFrontendRequest } from '@edfi/meadowlark-core';

export const MONGO_DOCUMENT_STORE_PLUGIN = '@edfi/meadowlark-mongodb-backend';
export const TEST_SIGNING_KEY =
  'v/AbsYGRvIfCf1bxufA6+Ras5NR+kIroLUg5RKYMjmqvNa1fVanmPBXKFH+MD1TPHpSgna0g+6oRnmRGUme6vJ7x91OA7Lp1hWzr6NnpdLYA9BmDHWjkRFvlx9bVmP+GTave2E4RAYa5b/qlvXOVnwaqEWzHxefqzkd1F1mQ6dVNFWYdiOmgw8ofQ87Xi1W0DkToRNS/Roc4rxby/BZwHUj7Y4tYdMpkWDMrZK6Vwat1KuPyiqsaBQYa9Xd0pxKqUOrAp8a+BFwiPfxf4nyVdOSAd77A/wuKIJaERNY5xJXUHwNgEOMf+Lg4032u4PnsnH7aJb2F4z8AhHldM6w5jw==';

export const CLIENT1_HEADERS = {
  Authorization:
    'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlZC1maS1tZWFkb3dsYXJrIiwiYXVkIjoibWVhZG93bGFyayIsInN1YiI6InN1cGVyLWdyZWF0LVNJUyIsImp0aSI6IjNkNTliNzVmLWE3NjItNGJhYS05MTE2LTE5YzgyZmRmOGRlMyIsImlhdCI6MTYzNjU2MjA2MCwiZXhwIjozODQ1NTQ4ODgxfQ.WF5ABFZAvNsLDZktwa8VxDR846fGptRXJObtQitbL8I',
};

export const CLIENT2_HEADERS = {
  Authorization:
    'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlZC1maS1tZWFkb3dsYXJrIiwiYXVkIjoibWVhZG93bGFyayIsInN1YiI6InNtYWxsLXRvd24tc2lzIiwianRpIjoiMGQwZWZmYTctYWExZi00N2E3LTk4NzktNDdhOGJkOWMzMWJiIiwiaWF0IjoxNjM2NTYyMDc5LCJleHAiOjM4NDU1NDg4ODF9.2QGyvx9flXdM9wjEHX_VPmeacCI3nm8WcV-T5AWxeWo',
};

export const JSON_HEADER = {
  'content-type': 'application/json',
};

export function newFrontendRequestTemplate(): FrontendRequest {
  return {
    ...newFrontendRequest(),
    stage: 'local',
  };
}

export function schoolBodyClient1(): FrontendRequest {
  return {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/schools',
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    body: `{
      "schoolId": 123,
      "gradeLevels": [],
      "nameOfInstitution": "abc",
      "educationOrganizationCategories": []
    }`,
  };
}

export function schoolBodyClient2(): FrontendRequest {
  return {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/schools',
    headers: { ...JSON_HEADER, ...CLIENT2_HEADERS },
    body: `{
    "schoolId": 123,
    "gradeLevels": [],
    "nameOfInstitution": "abc",
    "educationOrganizationCategories": []
  }`,
  };
}

export function schoolGetClient1(): FrontendRequest {
  return {
    ...newFrontendRequestTemplate(),
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    path: '/v3.3b/ed-fi/schools/x1GptgyYapmpBGiZegIbM2XC_NLMVVjisNLEtg',
  };
}

export function schoolGetClient2(): FrontendRequest {
  return {
    ...newFrontendRequestTemplate(),
    headers: { ...JSON_HEADER, ...CLIENT2_HEADERS },
    path: '/v3.3b/ed-fi/schools/x1GptgyYapmpBGiZegIbM2XC_NLMVVjisNLEtg',
  };
}

export const schoolDeleteClient1 = schoolGetClient1;
export const schoolDeleteClient2 = schoolGetClient2;

export function academicWeekBodyClient1(): FrontendRequest {
  return {
    ...newFrontendRequestTemplate(),
    path: '/v3.3b/ed-fi/academicWeeks',
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    body: `{
      "schoolReference": {
          "schoolId": 123
      },
      "weekIdentifier": "1st",
      "beginDate": "2022-12-01",
      "endDate": "2022-12-31",
      "totalInstructionalDays": 30
    }`,
  };
}

export function configureEnvironmentForMongoSystemTests(): void {
  process.env.DOCUMENT_STORE_PLUGIN = MONGO_DOCUMENT_STORE_PLUGIN;
  process.env.SIGNING_KEY = TEST_SIGNING_KEY;
  process.env.MEADOWLARK_DATABASE_NAME = 'meadowlark_system_tests';
}
