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
import { TraceId } from '../model/IdTypes';

export interface Headers {
  [header: string]: string | undefined;
}

export interface FrontendQueryParameters {
  [name: string]: string | undefined | number | boolean;
}

export interface FrontendRequestMiddleware {
  security: Security;
  pathComponents: PathComponents;

  /**
   * The request body parsed into an object
   */
  parsedBody: object;

  resourceInfo: ResourceInfo;

  // Note that TopLevelEntities are usually not JSON serializable
  matchingMetaEdModel: TopLevelEntity;
  documentInfo: DocumentInfo;
  headerMetadata: { [header: string]: string };

  // Whether to validate resources or not, currently pulled from role type 'assessment' from JWT
  validateResources: boolean;

  /**
   * A timestamp, usually used to capture the time of an insert or update request.
   * Can be used to total order inserts/updates when used in conjunction with the
   * backend rejection of inserts/updates that do not provide an increasing timestamp.
   */
  timestamp: number;
}

export interface FrontendRequest {
  /**
   * The requested action from a Meadowlark frontend
   */
  action: Action;
  /**
   * The URL path in the form /version/namespace/resource and optionally /resourceId
   * The path should not include query parameters
   */
  path: string;

  /**
   * A request identifier provided by the frontend service, used for log tracing
   */
  traceId: TraceId;

  /**
   * Unparsed request body provided by the frontend service as a string, or null if there is no body
   */
  body: string | null;

  headers: Headers;

  queryParameters: FrontendQueryParameters;

  /**
   * The stage, which is an optional prefix of the URL. Allows for multiple deployments on the same server
   * e.g. "dev" or "staging". Does not include slash characters.
   */
  stage: string;

  /**
   * The location of data provided by middlewares. Managed by meadowlark-core.
   */
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
    timestamp: 0,
  };
}

export function newFrontendRequest(): FrontendRequest {
  return {
    action: 'UNKNOWN',
    path: '',
    traceId: '' as TraceId,
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
 * Returns a copy of a FrontendRequest with the sensitive data 'parsedBody' field removed
 */
const removeParsedBody: (f: FrontendRequest) => FrontendRequest = R.dissocPath(['middleware', 'parsedBody']);

/**
 * Returns a copy of a FrontendRequest with the sensitive data 'documentIdentity' field removed
 */
const removeDocumentIdentity: (f: FrontendRequest) => FrontendRequest = R.dissocPath([
  'middleware',
  'documentInfo',
  'documentIdentity',
]);

/**
 * Returns a copy of a FrontendRequest with the sensitive data 'documentIdentity' field in the document references removed
 */
export const removeReferencesDocumentIdentity: (f: FrontendRequest) => FrontendRequest = (f: FrontendRequest) => {
  const cloneOfFrontendRequest: FrontendRequest = R.clone(f);
  const { documentReferences } = cloneOfFrontendRequest.middleware.documentInfo;
  cloneOfFrontendRequest.middleware.documentInfo.documentReferences = documentReferences.map((reference) =>
    (R.dissoc('documentIdentity') as any)(reference),
  );
  return cloneOfFrontendRequest;
};

/**
 * Returns a copy of a FrontendRequest suitable for logging, such as with non-serializable fields or sensitive data removed
 */
export const frontendRequestForLogging: (f: FrontendRequest) => FrontendRequest = R.pipe(
  removeMatchingMetaEdModel,
  removeBody,
  removeParsedBody,
  removeDocumentIdentity,
  removeReferencesDocumentIdentity,
);
