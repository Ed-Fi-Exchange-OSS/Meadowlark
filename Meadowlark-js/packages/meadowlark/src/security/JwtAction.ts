// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Jwt as nJwt, create, verify } from 'njwt';
import memoize from 'fast-memoize';
import { getValueFromEnvironment } from '../Environment';
import { JwtStatus, newJwtStatus } from './JwtStatus';
import { Jwt } from './Jwt';
import { Logger } from '../helpers/Logger';

const accessTokenRequired = memoize(() => getValueFromEnvironment('ACCESS_TOKEN_REQUIRED').toLowerCase() === 'true');

function signingKey(): Buffer {
  const signingKeyEncoded = getValueFromEnvironment('SIGNING_KEY');
  if (signingKeyEncoded == null) {
    throw new Error('Must have a base-64 encoded signing key. Try creating a new one with `yarn createKey`');
  }
  return Buffer.from(signingKeyEncoded, 'base64');
}
const cachedSigningKey = memoize(signingKey);

const claims = { iss: 'ed-fi-meadowlark', aud: 'meadowlark' };

/*
 * Creates a standard Meadowlark Jwt.
 */
export function createToken(vendor: string): Jwt {
  const token: Jwt = create({ ...claims, sub: vendor }, cachedSigningKey()) as Jwt;

  // Year is 2091
  token.setExpiration(3845548881000);
  return token;
}

/**
 * Converts a Jwt object to a Meadowlark JwtStatus
 */
function toJwtStatus(jwt: Jwt | undefined): JwtStatus {
  Logger.debug('JwtStatus.toJwtStatus', null, null, jwt);

  if (jwt == null) return { ...newJwtStatus(), isValid: false, isOwnershipEnabled: accessTokenRequired() };

  const failureMessages = ['Signature verification failed', 'Jwt cannot be parsed'];

  return {
    isOwnershipEnabled: accessTokenRequired(),
    isMissing: false,
    isValid: jwt != null && !failureMessages.includes(jwt.message),
    isExpired: jwt.message === 'Jwt is expired',
    issuer: jwt.body.iss ?? '',
    audience: jwt.body.aud ?? '',
    subject: jwt.body.sub ?? null,
    issuedAt: jwt.body.iat ?? 0,
    expiresAt: jwt.body.exp ?? 0,
  };
}

/*
 * Verifies that a JWT is valid, not expired, and returns parsed claim data.
 */
export function verifyJwt(authorization?: string): JwtStatus {
  if (authorization == null || !authorization.startsWith('bearer ')) {
    return { ...newJwtStatus(), isMissing: true, isValid: false, isOwnershipEnabled: accessTokenRequired() };
  }

  const token = authorization.split(' ')[1];

  try {
    const verified: nJwt | undefined = verify(token, cachedSigningKey());
    return toJwtStatus(verified as Jwt);
  } catch (err) {
    Logger.debug('Jwt.verifyPromise user-submitted token error', null, null, err);
    return toJwtStatus(err);
  }
}
