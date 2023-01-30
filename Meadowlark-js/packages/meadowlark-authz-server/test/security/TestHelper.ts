// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config } from '@edfi/meadowlark-utilities';
import { create as createJwt } from 'njwt';
import type { Jwt } from '../../src/security/Jwt';

export const ONE_HOUR_FROM_NOW = new Date().getTime() + 60 * 60 * 1000;
export const ONE_HOUR_AGO = new Date().getTime() - 60 * 60 * 1000;

export function createTokenString(
  clientId: string,
  roles: string[],
  expirationMillis: number = ONE_HOUR_FROM_NOW,
  tokenIssuer: string = Config.get('OAUTH_TOKEN_ISSUER'),
  tokenAudience: string = Config.get('OAUTH_TOKEN_AUDIENCE'),
  issuedAt: number | undefined = undefined,
): string {
  const token: Jwt = createJwt(
    { iss: tokenIssuer, aud: tokenAudience, roles, client_id: clientId },
    Config.get('OAUTH_SIGNING_KEY'),
  ) as Jwt;
  token.setExpiration(expirationMillis);

  if (issuedAt != null) {
    token.setIssuedAt(issuedAt);
  }

  return token.compact();
}

export function createAuthorizationHeader(
  clientId: string,
  roles: string[],
  expirationMillis: number = ONE_HOUR_FROM_NOW,
  tokenIssuer: string = Config.get('OAUTH_TOKEN_ISSUER'),
  tokenAudience: string = Config.get('OAUTH_TOKEN_AUDIENCE'),
): string {
  return `Bearer ${createTokenString(clientId, roles, expirationMillis, tokenIssuer, tokenAudience)}`;
}
