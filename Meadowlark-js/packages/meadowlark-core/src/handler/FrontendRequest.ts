// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { NoTopLevelEntity, TopLevelEntity } from '@edfi/metaed-core';
import { DocumentInfo, NoDocumentInfo } from '../model/DocumentInfo';
import { PathComponents, NoPathComponents } from '../model/PathComponents';
import { NoResourceInfo, ResourceInfo } from '../model/ResourceInfo';
import { Security, UndefinedSecurity } from '../security/Security';
import type { Action } from './Action';

export interface FrontendHeaders {
  [header: string]: string | undefined;
}

export interface FrontendQueryParameters {
  [name: string]: string | undefined;
}

export interface FrontendRequestMiddleware {
  security: Security;
  pathComponents: PathComponents;
  parsedBody: object;
  resourceInfo: ResourceInfo;
  // Note that TopLevelEntities are usually not JSON serializable
  matchingMetaEdModel: TopLevelEntity;
  documentInfo: DocumentInfo;
  headerMetadata: { [header: string]: string };
  // Whether to validate resources or not, currently pulled from role type 'assessment' from JWT
  validateResources: boolean;
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
   * Unparsed request body provided by the frontend service as a string, or null if there is no body
   */
  body: string | null;
  headers: FrontendHeaders;
  queryParameters: FrontendQueryParameters;
  stage: string; // For example, "local"
  middleware: FrontendRequestMiddleware;
}

export function newFrontendRequestMiddleware(): FrontendRequestMiddleware {
  return {
    security: UndefinedSecurity,
    pathComponents: NoPathComponents,
    parsedBody: {},
    resourceInfo: NoResourceInfo,
    matchingMetaEdModel: NoTopLevelEntity,
    documentInfo: NoDocumentInfo,
    headerMetadata: {},
    validateResources: true,
  };
}

export function newFrontendRequest(): FrontendRequest {
  return {
    action: 'UNKNOWN',
    path: '',
    traceId: '',
    body: null,
    headers: {},
    queryParameters: {},
    stage: '',
    middleware: newFrontendRequestMiddleware(),
  };
}

/**
 * Returns a copy of a FrontendRequest with the non-serializable 'matchingMetaEdModel' field removed
 */
const removeMatchingMetaEdModel: (f: FrontendRequest) => FrontendRequest = R.dissocPath([
  'middleware',
  'matchingMetaEdModel',
]);

/**
 * Returns a copy of a FrontendRequest with the sensitive data 'body' field removed
 */
const removeBody: (f: FrontendRequest) => FrontendRequest = R.dissoc('body') as (f: FrontendRequest) => FrontendRequest;

/**
 * Returns a copy of a FrontendRequest suitable for logging, such as with non-serializable fields or sensitive data removed
 */
export const frontendRequestForLogging: (f: FrontendRequest) => FrontendRequest = R.compose(
  removeBody,
  removeMatchingMetaEdModel,
);
