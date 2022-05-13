// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo, NoDocumentInfo } from '../model/DocumentInfo';
import { PathComponents, NoPathComponents } from '../model/PathComponents';
import { Security, UndefinedSecurity } from '../security/Security';
import type { HttpMethod } from './HttpMethod';

export interface FrontendHeaders {
  [header: string]: string | undefined;
}

export interface FrontendPathParameters {
  [name: string]: string | undefined;
}

export interface FrontendQueryStringParameters {
  [name: string]: string | undefined;
}

export interface FrontendRequestMiddleware {
  security: Security;
  pathComponents: PathComponents;
  parsedBody: object;
  documentInfo: DocumentInfo;
  headerMetadata: { [header: string]: string };
}

export interface FrontendRequest {
  method: HttpMethod;
  path: string;
  traceId: string;
  body: string | null;
  headers: FrontendHeaders;
  pathParameters: FrontendPathParameters;
  queryStringParameters: FrontendQueryStringParameters;
  stage: string; // For example, "local"
  middleware: FrontendRequestMiddleware;
}

export function newFrontendRequestMiddleware(): FrontendRequestMiddleware {
  return {
    security: UndefinedSecurity,
    pathComponents: NoPathComponents,
    parsedBody: {},
    documentInfo: NoDocumentInfo,
    headerMetadata: {},
  };
}

export function newFrontendRequest(): FrontendRequest {
  return {
    method: 'GET',
    path: '',
    traceId: '',
    body: null,
    headers: {},
    pathParameters: {},
    queryStringParameters: {},
    stage: '',
    middleware: newFrontendRequestMiddleware(),
  };
}
