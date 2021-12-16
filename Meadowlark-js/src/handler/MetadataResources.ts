// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export const CreateApiVersionObject = (serverBaseUrl: string) => {
  return `{
    "version": "5.3",
    "informationalVersion": "5.3",
    "suite": "3",
    "build": "5.3.663.0",
    "apiMode": "Sandbox",
    "dataModels": [
      {
        "name": "Ed-Fi",
        "version": "3.3.1-b"
      }
    ],
    "urls": {
      "dependencies": "",
      "openApiMetadata": "${serverBaseUrl}/metadata/",
      "oauth": "${process.env.TOKEN_URL}",
      "dataManagementApi": "${serverBaseUrl}/v3.3b/",
      "xsdMetadata": ""
    }
  }`;
};

export const OpenApiListTemplate = `[
  {
    "name": "Descriptors",
    "endpointUri": "{{ baseUrl }}/metadata/descriptors/swagger.json",
    "prefix": ""
  },
  {
    "name": "Resources",
    "endpointUri": "{{ baseUrl }}/metadata/resources/swagger.json",
    "prefix": ""
  }
]`;
