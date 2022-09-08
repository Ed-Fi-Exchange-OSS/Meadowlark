// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R, { Lens } from 'ramda';
import { newTopLevelEntity, NoTopLevelEntity, TopLevelEntity } from '@edfi/metaed-core';
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
 * Type of function that returns a new FrontendRequest based on the given one, with some values set differently.
 */
type FrontendRequestSetter = (f: FrontendRequest) => FrontendRequest;

/**
 * Creates copy of a FrontendRequest suitable for logging, such as removing non-serializable fields
 */
export function frontendRequestForLogging(frontendRequest: FrontendRequest): FrontendRequest {
  const serializableMatchingMetaEdModel = {
    ...newTopLevelEntity(),
    metaEdName: frontendRequest.middleware.matchingMetaEdModel.metaEdName,
  };
  const pathToMatchingMetaEdModel: Lens<any, any> = R.lensPath(['middleware', 'matchingMetaEdModel']);
  const replaceMatchingMetaEdModel: FrontendRequestSetter = R.set(
    pathToMatchingMetaEdModel,
    serializableMatchingMetaEdModel,
  );
  return replaceMatchingMetaEdModel(frontendRequest);
}
