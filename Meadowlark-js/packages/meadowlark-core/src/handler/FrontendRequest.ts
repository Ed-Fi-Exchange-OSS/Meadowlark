// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export interface FrontendHeaders {
  [header: string]: string | undefined;
}

export interface FrontendPathParameters {
  [name: string]: string | undefined;
}

export interface FrontendQueryStringParameters {
  [name: string]: string | undefined;
}

export interface FrontendRequest {
  path: string;
  traceId: string;
  body: string | null;
  headers: FrontendHeaders;
  pathParameters: FrontendPathParameters;
  queryStringParameters: FrontendQueryStringParameters;
  stage: string; // For example, "local"
}

export function newFrontendRequest(): FrontendRequest {
  return {
    path: '',
    traceId: '',
    body: null,
    headers: {},
    pathParameters: {},
    queryStringParameters: {},
    stage: '',
  };
}
