// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getIntegerFromEnvironment, getStringFromEnvironment } from '@edfi/meadowlark-utilities';

const DEFAULT_TOKEN_ISSUER = 'ed-fi-meadowlark';
const DEFAULT_TOKEN_AUDIENCE = 'ed-fi-meadowlark';

export function getTokenIssuer(): string {
  return getStringFromEnvironment('OAUTH_TOKEN_ISSUER', DEFAULT_TOKEN_ISSUER);
}

export function getTokenAudience(): string {
  return getStringFromEnvironment('OAUTH_TOKEN_AUDIENCE', DEFAULT_TOKEN_AUDIENCE);
}

export function getTokenExpiration(): number {
  return getIntegerFromEnvironment('OAUTH_EXPIRATION_MINUTES', 60);
}

export function getSigningKey(): string {
  return getStringFromEnvironment('OAUTH_SIGNING_KEY', undefined);
}
