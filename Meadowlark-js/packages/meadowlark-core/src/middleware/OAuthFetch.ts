// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import axios, { AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { Config } from '@edfi/meadowlark-utilities';

// Add default retry to Axios - 3 times, network errors or idempotent 500s
axiosRetry(axios);

/**
 * Call the configured OAuth server to get an own token, which will be used for client verification.
 * Can throw Axios exceptions.
 */
export async function fetchOwnAccessToken(): Promise<AxiosResponse> {
  return axios.post(
    Config.get('OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST'),
    {
      grant_type: 'client_credentials',
      client_id: Config.get('OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH'),
      client_secret: Config.get('OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH'),
    },
    {
      headers: { 'content-type': 'application/json' },
      validateStatus: () => true,
    },
  );
}

/**
 * Call the configured OAuth server to verify a client token, using an own token for verification permission.
 * Can throw Axios exceptions.
 */
export async function fetchClientTokenVerification(
  clientBearerToken: string,
  ownAccessToken: string,
): Promise<AxiosResponse> {
  return axios.post(Config.get('OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION'), `token=${clientBearerToken}`, {
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `bearer ${ownAccessToken}`,
    },
    validateStatus: (status: number) => status < 500,
  });
}
