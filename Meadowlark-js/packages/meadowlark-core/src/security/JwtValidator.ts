// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendResponse } from '../handler/FrontendResponse';
import { verifyJwt } from './JwtAction';
import { JwtStatus } from './JwtStatus';

export type JwtValidation = {
  jwtStatus: JwtStatus;
  errorResponse?: FrontendResponse;
};

export function validateJwt(authorizationHeader: string | undefined): JwtValidation {
  const jwtStatus: JwtStatus = verifyJwt(authorizationHeader);

  if (jwtStatus.isValid) {
    return { jwtStatus };
  }

  if (jwtStatus.isMissing) {
    return {
      jwtStatus,
      errorResponse: {
        statusCode: 401,
        body: '{ "error": "invalid_client", "error_description": "Authorization token not provided" }',
        headers: { 'WWW-Authenticate': 'Bearer' },
      },
    };
  }

  if (jwtStatus.isExpired) {
    return {
      jwtStatus,
      errorResponse: {
        statusCode: 401,
        body: '{ "error": "invalid_token", "error_description": "Token is expired" }',
        headers: { 'WWW-Authenticate': 'Bearer' },
      },
    };
  }

  if (jwtStatus.authorizationStrategy === '') {
    return {
      jwtStatus,
      errorResponse: {
        statusCode: 401,
        body: '{ "error": "invalid_token", "error_description": "Roles are missing or roles are invalid on token" }',
        headers: { 'WWW-Authenticate': 'Bearer' },
      },
    };
  }

  return {
    jwtStatus,
    errorResponse: {
      statusCode: 401,
      body: '{ "error": "invalid_token", "error_description": "Invalid authorization token" }',
      headers: { 'WWW-Authenticate': 'Bearer' },
    },
  };
}
