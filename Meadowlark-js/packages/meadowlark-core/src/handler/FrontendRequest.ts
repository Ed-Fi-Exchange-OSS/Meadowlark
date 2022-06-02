// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo, NoDocumentInfo } from '../model/DocumentInfo';
import { PathComponents, NoPathComponents } from '../model/PathComponents';
import { NoResourceInfo, ResourceInfo } from '../model/ResourceInfo';
import { Security, UndefinedSecurity } from '../security/Security';
import type { Action } from './Action';

export interface FrontendHeaders {
  [header: string]: string | undefined;
}

export interface FrontendQueryStringParameters {
  [name: string]: string | undefined;
}

export interface FrontendRequestMiddleware {
  security: Security;
  pathComponents: PathComponents;
  parsedBody: object;
  resourceInfo: ResourceInfo;
  documentInfo: DocumentInfo;
  headerMetadata: { [header: string]: string };
}

export interface FrontendRequest {
  action: Action;
  /**
   * The URL path in the form /version/namespace/resource and optionally /resourceId
   * The path should not include query parameters
   */
  path: string;

  /**
   * A request identifier provided by the frontend service, used for log tracing
   */
  traceId: string;

  /**
   * Unparsed request body provided by the frontend service as a string, or null if the is no body
   */
  body: string | null;
  headers: FrontendHeaders;
  queryStringParameters: FrontendQueryStringParameters;
  stage: string; // For example, "local"
  middleware: FrontendRequestMiddleware;
}

export function newFrontendRequestMiddleware(): FrontendRequestMiddleware {
  return {
    security: UndefinedSecurity,
    pathComponents: NoPathComponents,
    parsedBody: {},
    resourceInfo: NoResourceInfo,
    documentInfo: NoDocumentInfo,
    headerMetadata: {},
  };
}

export function newFrontendRequest(): FrontendRequest {
  return {
    action: 'UNKNOWN',
    path: '',
    traceId: '',
    body: null,
    headers: {},
    queryStringParameters: {},
    stage: '',
    middleware: newFrontendRequestMiddleware(),
  };
}
