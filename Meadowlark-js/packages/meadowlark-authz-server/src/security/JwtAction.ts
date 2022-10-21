// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Jwt as nJwt, verify } from 'njwt';
import memoize from 'fast-memoize';
import { getStringFromEnvironment, Logger } from '@edfi/meadowlark-utilities';
import { JwtStatus, newJwtStatus } from './JwtStatus';
import { Jwt } from './Jwt';

function signingKey(): Buffer {
  const signingKeyEncoded = getStringFromEnvironment('SIGNING_KEY');
  if (signingKeyEncoded == null) {
    throw new Error('Must have a base-64 encoded signing key. Try creating a new one with `yarn createKey`');
  }
  return Buffer.from(signingKeyEncoded, 'base64');
}
const cachedSigningKey = memoize(signingKey);

/**
 * Converts a Jwt object to a Meadowlark JwtStatus
 */
function toJwtStatus(jwt: Jwt | undefined): JwtStatus {
  Logger.debug('JwtStatus.toJwtStatus', null, jwt);

  if (jwt == null) return { ...newJwtStatus(), isValid: false };

  const failureMessages = ['Signature verification failed', 'Jwt cannot be parsed'];

  return {
    isMissing: false,
    isValid: jwt != null && !failureMessages.includes(jwt.message),
    isExpired: jwt.message === 'Jwt is expired',
    issuer: jwt.body?.iss ?? '',
    audience: jwt.body?.aud ?? '',
    subject: jwt.body?.sub ?? null,
    clientId: jwt.body?.client_id ?? null,
    issuedAt: jwt.body?.iat ?? 0,
    expiresAt: jwt.body?.exp ?? 0,
    roles: jwt.body?.roles ?? [],
  };
}

/*
 * Verifies that a JWT is valid, not expired, and returns parsed claim data.
 */
export function verifyJwt(authorization?: string): JwtStatus {
  Logger.debug('JwtStatus.verifyJwt authorization header', null, authorization ?? '*None Supplied*');
  // "Bearer" is case sensitive per the spec. Accept "bearer" for flexibility.
  if (authorization == null || (!authorization.startsWith('Bearer ') && !authorization.startsWith('bearer '))) {
    return { ...newJwtStatus(), isMissing: true, isValid: false };
  }

  const token = authorization.split(' ')[1];

  try {
    const verified: nJwt | undefined = verify(token, cachedSigningKey());
    return toJwtStatus(verified as Jwt);
  } catch (err) {
    Logger.debug('Jwt.verifyPromise user-submitted token error', null, err);
    return toJwtStatus(err);
  }
}