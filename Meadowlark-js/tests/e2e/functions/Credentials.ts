// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { baseURLRequest } from '../Setup';

// eslint-disable-next-line no-shadow
export enum Clients {
  Vendor1,
  Vendor2,
  Host1,
  Assessment1,
}

export const accessTokens: Array<{ client: Clients; token: string }> = [];

interface Credentials {
  key: string | undefined;
  secret: string | undefined;
}

function getCredentials(client: Clients): Credentials {
  let credentials: Credentials;
  switch (client) {
    case Clients.Vendor1:
      credentials = {
        key: process.env.VENDOR_KEY_1,
        secret: process.env.VENDOR_SECRET_1,
      };
      break;
    case Clients.Vendor2:
      credentials = {
        key: process.env.VENDOR_KEY_2,
        secret: process.env.VENDOR_SECRET_2,
      };
      break;
    case Clients.Host1:
      credentials = {
        key: process.env.HOST_KEY_1,
        secret: process.env.HOST_SECRET_1,
      };
      break;
    case Clients.Assessment1:
      credentials = {
        key: process.env.ASSESSMENT_KEY_1,
        secret: process.env.ASSESSMENT_SECRET_1,
      };
      break;

    default:
      throw new Error('Specify desired client');
  }

  return credentials;
}

export async function getAccessToken(client: Clients): Promise<string> {
  const credentials = getCredentials(client);

  let token: string = accessTokens.find((t) => t.client === client)?.token ?? '';
  if (!token) {
    token = await baseURLRequest
      .post('/api/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: credentials.key,
        client_secret: credentials.secret,
      })
      .then((response) => response.body.access_token);

    accessTokens.push({ client, token });
  }

  return token;
}
