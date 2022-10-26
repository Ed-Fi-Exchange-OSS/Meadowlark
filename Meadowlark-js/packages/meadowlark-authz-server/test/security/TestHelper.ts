// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { create as createJwt } from 'njwt';
import { TOKEN_ISSUER } from '../../src/security/TokenIssuer';
import type { Jwt } from '../../src/security/Jwt';
import { signingKey } from '../../src/model/SigningKey';

export const ONE_HOUR_FROM_NOW = new Date().getTime() + 60 * 60 * 1000;
export const ONE_HOUR_AGO = new Date().getTime() - 60 * 60 * 1000;

export function createTokenString(
  clientId: string,
  roles: string[],
  expirationMillis: number = ONE_HOUR_FROM_NOW,
  tokenIssuer: string = TOKEN_ISSUER,
): string {
  const token: Jwt = createJwt({ iss: tokenIssuer, aud: tokenIssuer, roles, client_id: clientId }, signingKey) as Jwt;
  token.setExpiration(expirationMillis);
  return token.compact();
}

export function createAuthorizationHeader(
  clientId: string,
  roles: string[],
  expirationMillis: number = ONE_HOUR_FROM_NOW,
  tokenIssuer: string = TOKEN_ISSUER,
): string {
  return `Bearer ${createTokenString(clientId, roles, expirationMillis, tokenIssuer)}`;
}
