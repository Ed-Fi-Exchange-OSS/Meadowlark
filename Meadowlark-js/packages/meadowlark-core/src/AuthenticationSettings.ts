// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getStringFromEnvironment } from '@edfi/meadowlark-utilities';

export function getOAuthTokenURL(): string {
  return getStringFromEnvironment('OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST', undefined);
}

export function getOAuthVerifyURL(): string {
  return getStringFromEnvironment('OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION', undefined);
}

export function getOwnClientId(): string {
  return getStringFromEnvironment('OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH');
}

export function getOwnClientSecret(): string {
  return getStringFromEnvironment('OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH');
}
