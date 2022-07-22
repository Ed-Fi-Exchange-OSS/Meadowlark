// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, newFrontendRequest, SystemTestablePlugin, SystemTestClient, Logger } from '@edfi/meadowlark-core';

// Enviroment setup
const TEST_SIGNING_KEY =
  'v/AbsYGRvIfCf1bxufA6+Ras5NR+kIroLUg5RKYMjmqvNa1fVanmPBXKFH+MD1TPHpSgna0g+6oRnmRGUme6vJ7x91OA7Lp1hWzr6NnpdLYA9BmDHWjkRFvlx9bVmP+GTave2E4RAYa5b/qlvXOVnwaqEWzHxefqzkd1F1mQ6dVNFWYdiOmgw8ofQ87Xi1W0DkToRNS/Roc4rxby/BZwHUj7Y4tYdMpkWDMrZK6Vwat1KuPyiqsaBQYa9Xd0pxKqUOrAp8a+BFwiPfxf4nyVdOSAd77A/wuKIJaERNY5xJXUHwNgEOMf+Lg4032u4PnsnH7aJb2F4z8AhHldM6w5jw==';
process.env.SIGNING_KEY = TEST_SIGNING_KEY;
process.env.MEADOWLARK_DATABASE_NAME = 'meadowlark_system_tests';

if (process.env.DOCUMENT_STORE_PLUGIN == null) process.env.DOCUMENT_STORE_PLUGIN = '@edfi/meadowlark-mongodb-backend';

// eslint-disable-next-line import/no-mutable-exports
let backend: SystemTestablePlugin;
(async () => {
  Logger.warn(`**** System test loading package '${process.env.DOCUMENT_STORE_PLUGIN}'`, null);
  backend = await import(process.env.DOCUMENT_STORE_PLUGIN ?? '');
})();

// Adds 500ms pause before each system test setup, giving time for any prior db teardown to complete
export const backendToTest: SystemTestablePlugin = {
  systemTestSetup: async (): Promise<SystemTestClient> => {
    await new Promise((r) => {
      setTimeout(r, 500);
    });
    return backend.systemTestSetup();
  },
  systemTestTeardown: async (client: SystemTestClient): Promise<void> => {
    backend.systemTestTeardown(client);
  },
};

// Test data

export const CLIENT1_HEADERS = {
  Authorization:
    'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlZC1maS1tZWFkb3dsYXJrIiwiYXVkIjoibWVhZG93bGFyayIsInJvbGVzIjpbInZlbmRvciJdLCJzdWIiOiJzdXBlci1ncmVhdC1TSVMiLCJqdGkiOiIyNGMyMDIyMC1mMjg1LTRlNjMtYThmNC1iMmRkYzM5MzAwMDQiLCJpYXQiOjE2NTg1MjM0MDgsImV4cCI6MjY1ODUyNzAwOH0.S2C44HoFMr5ZYSUkbZoAV2pz7Z1Xi40yynH17GOBVoY',
};

export const CLIENT2_HEADERS = {
  Authorization:
    'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlZC1maS1tZWFkb3dsYXJrIiwiYXVkIjoibWVhZG93bGFyayIsInN1YiI6InNtYWxsLXRvd24tc2lzIiwianRpIjoiMGQwZWZmYTctYWExZi00N2E3LTk4NzktNDdhOGJkOWMzMWJiIiwiaWF0IjoxNjM2NTYyMDc5LCJleHAiOjM4NDU1NDg4ODEsInJvbGVzIjpbInZlbmRvciJdfQ.1nTCwqHcUmuUwNBF8Z2NTHqTg8HPN0mWUQ10TqOCEi0',
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
    path: '/v3.3b/ed-fi/schools/L9gXuk9vioIoG64QKp8NFO2f3AOe78fV-HrtfQ',
  };
}

export function schoolGetClient2(): FrontendRequest {
  return {
    ...newFrontendRequestTemplate(),
    headers: { ...JSON_HEADER, ...CLIENT2_HEADERS },
    path: '/v3.3b/ed-fi/schools/L9gXuk9vioIoG64QKp8NFO2f3AOe78fV-HrtfQ',
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
