// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { JwtStatus, verifyJwt } from '@edfi/meadowlark-core';
import { AuthorizationResponse } from '../handler/AuthorizationResponse';

export function checkForAuthorizationErrors(authorizationHeader: string | undefined): AuthorizationResponse | undefined {
  const jwtStatus: JwtStatus = verifyJwt(authorizationHeader);

  if (jwtStatus.isMissing) {
    return {
      statusCode: 401,
      body: '{ "error": "invalid_client", "error_description": "Authorization token not provided" }',
      headers: { 'WWW-Authenticate': 'Bearer' },
    };
  }

  if (jwtStatus.isExpired) {
    return {
      statusCode: 401,
      body: '{ "error": "invalid_token", "error_description": "Token is expired" }',
      headers: { 'WWW-Authenticate': 'Bearer' },
    };
  }

  if (!jwtStatus.roles.some((role) => role.toLocaleLowerCase() === 'admin')) {
    return {
      statusCode: 403,
      body: '',
      headers: { 'WWW-Authenticate': 'Bearer' },
    };
  }

  if (jwtStatus.isValid) {
    return undefined;
  }

  return {
    statusCode: 401,
    body: '{ "error": "invalid_token", "error_description": "Invalid authorization token" }',
    headers: { 'WWW-Authenticate': 'Bearer' },
  };
}
