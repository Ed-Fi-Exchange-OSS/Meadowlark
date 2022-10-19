// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { JwtStatus, verifyJwt, Logger } from '@edfi/meadowlark-core';
import { Jwt as nJwt, verify } from 'njwt';
import { AuthorizationResponse } from '../handler/AuthorizationResponse';
import { Jwt } from './Jwt';
import { signingKey } from '../model/SigningKey';
import { IntrospectedToken } from './IntrospectedToken';
import { TOKEN_ISSUER } from './TokenIssuer';
import { GetAuthorizationClientResult } from '../message/GetAuthorizationClientResult';
import { getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';

export function hasAdminRole(roles: string[]): boolean {
  return roles.some((role) => role.toLocaleLowerCase() === 'admin');
}

export type ValidateTokenResult =
  | { isValid: true; roles: string[]; clientId: string }
  | { isValid: false; errorResponse: AuthorizationResponse };

export function validateTokenForAccess(authorizationHeader: string | undefined): ValidateTokenResult {
  const jwtStatus: JwtStatus = verifyJwt(authorizationHeader);

  if (jwtStatus.isMissing) {
    return {
      isValid: false,
      errorResponse: {
        statusCode: 401,
        body: '{ "error": "invalid_client", "error_description": "Authorization token not provided" }',
        headers: { 'WWW-Authenticate': 'Bearer' },
      },
    };
  }

  if (jwtStatus.isExpired) {
    return {
      isValid: false,
      errorResponse: {
        statusCode: 401,
        body: '{ "error": "invalid_token", "error_description": "Token is expired" }',
        headers: { 'WWW-Authenticate': 'Bearer' },
      },
    };
  }

  if (jwtStatus.isValid) {
    return { isValid: true, roles: jwtStatus.roles, clientId: jwtStatus.clientId ?? '' };
  }

  return {
    isValid: false,
    errorResponse: {
      statusCode: 401,
      body: '{ "error": "invalid_token", "error_description": "Invalid authorization token" }',
      headers: { 'WWW-Authenticate': 'Bearer' },
    },
  };
}

export function validateAdminTokenForAccess(authorizationHeader: string | undefined): AuthorizationResponse | undefined {
  const validateTokenResult: ValidateTokenResult = validateTokenForAccess(authorizationHeader);

  if (!validateTokenResult.isValid) return validateTokenResult.errorResponse;

  if (!hasAdminRole(validateTokenResult.roles)) {
    return {
      statusCode: 403,
      body: '',
      headers: { 'WWW-Authenticate': 'Bearer' },
    };
  }

  return undefined;
}

/**
 * Returns true if the client id is found in the authentication store
 */
async function isValidClientId(clientId: string | undefined, traceId: string): Promise<boolean> {
  if (clientId == null) return false;

  // Go to authentication datastore
  const result: GetAuthorizationClientResult = await getAuthorizationStore().getAuthorizationClient({
    clientId,
    traceId,
  });

  return result.response === 'GET_SUCCESS';
}

export type IntrospectionResponse = { isValid: false } | { isValid: true; introspectedToken: IntrospectedToken };

/*
 * Verifies that a bearer token is valid, not expired, etc. Returns parsed claim data
 * as a ParsedBearerToken. Uses nJWT verify()
 */
export async function introspectBearerToken(bearerToken: string, traceId: string): Promise<IntrospectionResponse> {
  Logger.debug('TokenValidator.introspectBearerToken token', traceId, bearerToken);

  let verified: nJwt | undefined;
  try {
    verified = verify(bearerToken, signingKey());
  } catch (err) {
    Logger.debug('TokenValidator.introspectBearerToken nJwt responded with exception', traceId, err);
    if (err.message !== 'Jwt is expired') return { isValid: false };
    return {
      isValid: true,
      introspectedToken: {
        active: false,
        client_id: err.parsedBody?.client_id ?? '',
        sub: err.parsedBody?.sub ?? '',
        aud: err.parsedBody?.aud ?? '',
        iss: err.parsedBody?.iss ?? '',
        exp: err.parsedBody?.exp ?? 0,
        iat: err.parsedBody?.iat ?? 0,
        roles: err.parsedBody?.roles ?? [],
      },
    };
  }

  if (verified == null) return { isValid: false };
  const jwt: Jwt = verified as Jwt;

  const nJwtErrorMessages = ['Signature verification failed', 'Jwt cannot be parsed'];

  // Check for error response from nJwt in message
  if (nJwtErrorMessages.includes(jwt.message)) return { isValid: false };

  // Check for correct issuer
  if (jwt.body?.iss !== TOKEN_ISSUER || jwt.body?.aud !== TOKEN_ISSUER) return { isValid: false };

  // Checked for expired in catch, but just in case
  const isNotExpired: boolean = jwt.message !== 'Jwt is expired';
  const active: boolean = isNotExpired && (await isValidClientId(jwt.body?.client_id, traceId));

  return {
    isValid: true,
    introspectedToken: {
      active,
      client_id: jwt.body?.client_id ?? '',
      sub: jwt.body?.sub ?? '',
      aud: jwt.body?.aud ?? '',
      iss: jwt.body?.iss ?? '',
      exp: jwt.body?.exp ?? 0,
      iat: jwt.body?.iat ?? 0,
      roles: jwt.body?.roles ?? [],
    },
  };
}
