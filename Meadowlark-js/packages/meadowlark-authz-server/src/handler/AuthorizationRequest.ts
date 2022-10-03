// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export interface AuthorizationHeaders {
  [header: string]: string | undefined;
}

export interface AuthorizationQueryParameters {
  [name: string]: string | undefined;
}

export interface AuthorizationRequest {
  /**
   * The URL path, which should not include query parameters
   */
  path: string;

  /**
   * A request identifier provided by the authorization service, used for log tracing
   */
  traceId: string;

  /**
   * Unparsed request body provided by the authorization service as a string, or null if there is no body
   */
  body: string | null;

  /**
   * Headers from the request as an object
   */
  headers: AuthorizationHeaders;

  /**
   * Query parameters from the request as an object
   */
  queryParameters: AuthorizationQueryParameters;

  /**
   * The stage, which is an optional prefix of the URL. Allows for multiple deployments on the same server
   * e.g. "dev" or "staging". Does not include slash characters.
   */
  stage: string;
}

export function newAuthorizationRequest(): AuthorizationRequest {
  return {
    path: '',
    traceId: '',
    body: null,
    headers: {},
    queryParameters: {},
    stage: '',
  };
}
