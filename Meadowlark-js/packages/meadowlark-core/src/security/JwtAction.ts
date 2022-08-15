// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Jwt as nJwt, create, verify } from 'njwt';
import memoize from 'fast-memoize';
import { getValueFromEnvironment } from '../Environment';
import { JwtStatus, newJwtStatus } from './JwtStatus';
import { Jwt } from './Jwt';
import { Logger } from '../Logger';
import { determineAuthStrategyFromRoles } from '../middleware/ParseUserRole';
import { AuthorizationStrategy } from './Security';

function signingKey(): Buffer {
  const signingKeyEncoded = getValueFromEnvironment('SIGNING_KEY');
  if (signingKeyEncoded == null) {
    throw new Error('Must have a base-64 encoded signing key. Try creating a new one with `yarn createKey`');
  }
  return Buffer.from(signingKeyEncoded, 'base64');
}
const cachedSigningKey = memoize(signingKey);

const claims = { iss: 'ed-fi-meadowlark', aud: 'meadowlark', roles: [] as string[] };

/*
 * Creates a standard Meadowlark Jwt.
 */
export function createToken(vendor: string, role: string): Jwt {
  claims.roles = [role];
  const token: Jwt = create({ ...claims, sub: vendor }, cachedSigningKey()) as Jwt;

  token.setExpiration(new Date().getTime() + 60 * 60 * 1000); // One hour from now
  return token;
}

/**
 * Converts a Jwt object to a Meadowlark JwtStatus
 */
function toJwtStatus(jwt: Jwt | undefined): JwtStatus {
  Logger.debug('JwtStatus.toJwtStatus', null, jwt);

  if (jwt == null) return { ...newJwtStatus(), isValid: false };

  const failureMessages = ['Signature verification failed', 'Jwt cannot be parsed'];

  // Check that roles exist on the JWT and that there we can map a role to an authorization strategy
  // otherwise this is not a valid token
  let authStrategyFromJWT: AuthorizationStrategy = 'UNDEFINED';

  if ((jwt.body?.roles?.length ?? 0) > 0) {
    authStrategyFromJWT = determineAuthStrategyFromRoles(jwt.body.roles as string[]);
  }

  return {
    isMissing: false,
    isValid: jwt != null && !failureMessages.includes(jwt.message) && authStrategyFromJWT !== 'UNDEFINED',
    isExpired: jwt.message === 'Jwt is expired',
    issuer: jwt.body?.iss ?? '',
    audience: jwt.body?.aud ?? '',
    subject: jwt.body?.sub ?? null,
    clientId: jwt.body.client_id ?? null,
    issuedAt: jwt.body?.iat ?? 0,
    expiresAt: jwt.body?.exp ?? 0,
    roles: jwt.body?.roles ?? [],
    authorizationStrategy: authStrategyFromJWT as AuthorizationStrategy,
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
