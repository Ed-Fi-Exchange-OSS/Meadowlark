// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getOAuthTokenURL } from '../AuthenticationSettings';

export const CreateApiVersionObject = (serverBaseUrl: string) => ({
  version: '1.0.0',
  apiMode: 'SharedInstance',
  dataModels: [
    {
      name: 'Ed-Fi',
      version: '3.3.1-b',
    },
  ],
  urls: {
    dependencies: `${serverBaseUrl}/metadata/data/v3/dependencies`,
    openApiMetadata: `${serverBaseUrl}/metadata/`,
    oauth: getOAuthTokenURL(),
    dataManagementApi: `${serverBaseUrl}/v3.3b/`,
    xsdMetadata: `${serverBaseUrl}/metadata/xsd`,
  },
});

export const OpenApiListTemplate = (serverBaseUrl: string) => [
  {
    name: 'Descriptors',
    endpointUri: `${serverBaseUrl}/metadata/descriptors/swagger.json`,
    prefix: '',
  },
  {
    name: 'Resources',
    endpointUri: `${serverBaseUrl}/metadata/resources/swagger.json`,
    prefix: '',
  },
];

export const XsdTemplate = [
  {
    description: 'Core schema (Ed-Fi) files for the data model',
    name: 'ed-fi',
    version: '3.3.1-b',
    files: 'https://api.ed-fi.org/v5.3/api/metadata/xsd/ed-fi/files',
  },
];
