// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  FrontendRequest,
  newFrontendRequest,
  newFrontendRequestMiddleware,
  SystemTestablePlugin,
  SystemTestClient,
} from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';

// Environment setup
const TEST_SIGNING_KEY =
  'zE1mgVCZ01pO5gEioEp/ShcdVMcYjvGMMyE37Tu513WzSgDr4gtMKAFSWrprwXa825Eeu7xj2Ok35KFChE+6oyDF0PuVQdf9YaE9iTTs/nLXDbOJspDvQswYZ7Iq5Mx6lIcixgLbWcK/OckOin608ivPa5aLkJOJXDdl2cgwgf1E9rHWuRs0iYNWoMbqGN2iFH5af3wOF/RusrWJDLLJ9riWeIINeZwzE9cLq75hLBHLpQlcz9enU1zC49B93OTPWPwCqZIBaSqvbsgSULYANoU0JZa+NB5BsgrmlQgldfEPLQj73z09a7yqLAwlJJRYXuJQo6onYQ7RVVHD4PD2Sg==';
process.env.OAUTH_SIGNING_KEY = TEST_SIGNING_KEY;
process.env.MEADOWLARK_DATABASE_NAME = 'meadowlark_system_tests';

if (process.env.DOCUMENT_STORE_PLUGIN == null) process.env.DOCUMENT_STORE_PLUGIN = '@edfi/meadowlark-mongodb-backend';
if (process.env.AUTHORIZATION_STORE_PLUGIN == null) process.env.AUTHORIZATION_STORE_PLUGIN = '@edfi/meadowlark-authz-server';

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
    await backend.systemTestTeardown(client);
  },
};

// Test data

export const CLIENT1_HEADERS = {
  Authorization:
    'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlZC1maS1tZWFkb3dsYXJrIiwiYXVkIjoibWVhZG93bGFyayIsInJvbGVzIjpbInZlbmRvciJdLCJzdWIiOiJzdXBlci1ncmVhdC1TSVMiLCJjbGllbnRfaWQiOiJjM1Z3WlhJdFozSmxZWFF0VTBsVCIsImp0aSI6IjI0YzIwMjIwLWYyODUtNGU2My1hOGY0LWIyZGRjMzkzMDAwNCIsImlhdCI6MTY1ODUyMzQwOCwiZXhwIjoyNjU4NTI3MDA4fQ.0Nxd34sGJwkNj4FN8s0iBulZppkCHsQ1lT9JVQTNcxM',
};

export const CLIENT2_HEADERS = {
  Authorization:
    'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlZC1maS1tZWFkb3dsYXJrIiwiYXVkIjoibWVhZG93bGFyayIsInN1YiI6InNtYWxsLXRvd24tc2lzIiwiY2xpZW50X2lkIjoiYzIxaGJHd3RkRzkzYmkxemFYTT0iLCJqdGkiOiIwZDBlZmZhNy1hYTFmLTQ3YTctOTg3OS00N2E4YmQ5YzMxYmIiLCJpYXQiOjE2MzY1NjIwNzksImV4cCI6Mzg0NTU0ODg4MSwicm9sZXMiOlsidmVuZG9yIl19.kh1qtfWMrAHhIyJ7y2rsL103n7iGyWKavhrY7_FTL2w',
};

export const JSON_HEADER = {
  'content-type': 'application/json',
};

export function newFrontendRequestTemplateClient1(): FrontendRequest {
  return {
    ...newFrontendRequest(),
    stage: 'local',
    middleware: {
      ...newFrontendRequestMiddleware(),
      security: {
        authorizationStrategy: { type: 'OWNERSHIP_BASED' },
        clientId: 'client1',
      },
      validateResources: true,
    },
  };
}

export function newFrontendRequestTemplateClient2(): FrontendRequest {
  return {
    ...newFrontendRequest(),
    stage: 'local',
    middleware: {
      ...newFrontendRequestMiddleware(),
      security: {
        authorizationStrategy: { type: 'OWNERSHIP_BASED' },
        clientId: 'client2',
      },
      validateResources: true,
    },
  };
}

export function schoolBodyClient1(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient1(),
    path: '/v3.3b/ed-fi/schools',
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    body: `{
      "schoolId": 123,
      "gradeLevels": [
        {
            "gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#First Grade"
        }
      ],
      "nameOfInstitution": "abc",
      "educationOrganizationCategories": [
        {
          "educationOrganizationCategoryDescriptor": "uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other"
        }
      ]
    }`,
  };
}

export function schoolBodyClient2(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient2(),
    path: '/v3.3b/ed-fi/schools',
    headers: { ...JSON_HEADER, ...CLIENT2_HEADERS },
    body: `{
    "schoolId": 123,
    "gradeLevels": [
      {
          "gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#First Grade"
      }
    ],
    "nameOfInstitution": "abc",
    "educationOrganizationCategories": [
      {
        "educationOrganizationCategoryDescriptor": "uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other"
      }
    ]
  }`,
  };
}

export function schoolGetClient1(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient1(),
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    path: '/v3.3b/ed-fi/schools/LZRuhjvR1UiLz9Tat_4HOBmlPt_xB_pA20fKyQ',
  };
}

export function schoolGetClient2(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient2(),
    headers: { ...JSON_HEADER, ...CLIENT2_HEADERS },
    path: '/v3.3b/ed-fi/schools/LZRuhjvR1UiLz9Tat_4HOBmlPt_xB_pA20fKyQ',
  };
}

export const schoolDeleteClient1 = schoolGetClient1;
export const schoolDeleteClient2 = schoolGetClient2;

export function academicWeekBodyClient1(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient1(),
    path: '/v3.3b/ed-fi/academicWeeks',
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    body: `{
      "schoolReference": {
          "schoolId": 123
      },
      "weekIdentifier": "123456",
      "beginDate": "2022-12-01",
      "endDate": "2022-12-31",
      "totalInstructionalDays": 30
    }`,
  };
}

export function descriptorBodyClient1(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient1(),
    path: '/v3.3b/ed-fi/absenceEventCategoryDescriptors',
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    body: `{
      "codeValue": "test1",
      "shortDescription": "test1",
      "description": "test1",
      "namespace": "uri://ed-fi.org/AbsenceEventCategoryDescriptor"
    }`,
  };
}

export function descriptorGetClient1(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient1(),
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    path: '/v3.3b/ed-fi/absenceEventCategoryDescriptors/y0MjzEODRvlXBthuHA_XOiF52Vjb8d64VQy9qA',
  };
}

export function descriptorGetClient2(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient2(),
    headers: { ...JSON_HEADER, ...CLIENT2_HEADERS },
    path: '/v3.3b/ed-fi/absenceEventCategoryDescriptors/y0MjzEODRvlXBthuHA_XOiF52Vjb8d64VQy9qA',
  };
}

export function schoolCategoryDescriptorBody(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient1(),
    path: '/v3.3b/ed-fi/schoolCategoryDescriptors',
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    body: `{
      "codeValue": "All Levels",
      "shortDescription": "All Levels",
      "description": "All Levels",
      "namespace": "uri://ed-fi.org/SchoolCategoryDescriptor"
    }`,
  };
}

export function schoolBodyWithDescriptorReference(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient1(),
    path: '/v3.3b/ed-fi/schools',
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    body: `{
    "schoolId": 123,
    "schoolCategories": [
      {
           "schoolCategoryDescriptor": "uri://ed-fi.org/SchoolCategoryDescriptor#All Levels"
      }
    ],
    "gradeLevels": [
      {
          "gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#First Grade"
      }
    ],
    "nameOfInstitution": "abc",
    "educationOrganizationCategories": [
      {
        "educationOrganizationCategoryDescriptor": "uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other"
      }
    ]
  }`,
  };
}

export function schoolCategoryDelete(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient1(),
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    path: '/v3.3b/ed-fi/schoolCategoryDescriptors/2ch5Vfdy8AARhPR3h-69z6l1y2mrsIEa1wvxIQ',
  };
}

export function gradeLevelDescriptorBody(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient1(),
    path: '/v3.3b/ed-fi/gradeLevelDescriptors',
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    body: `{
      "codeValue": "First Grade",
      "shortDescription": "First Grade",
      "description": "First Grade",
      "namespace": "uri://ed-fi.org/GradeLevelDescriptor"
    }`,
  };
}

export function educationOrganizationCategoryDescriptorBody(): FrontendRequest {
  return {
    ...newFrontendRequestTemplateClient1(),
    path: '/v3.3b/ed-fi/educationOrganizationCategoryDescriptors',
    headers: { ...JSON_HEADER, ...CLIENT1_HEADERS },
    body: `{
      "codeValue": "Other",
      "shortDescription": "Other",
      "description": "Other",
      "namespace": "uri://ed-fi.org/EducationOrganizationCategoryDescriptor"
    }`,
  };
}
