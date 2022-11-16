// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import memoize from 'fast-memoize';
import { baseURLRequest } from './Shared';

export type Clients = 'Vendor' | 'Host' | 'Admin';

type Credentials = {
  clientName: string;
  roles: Array<string>;
  key?: string;
  secret?: string;
  token?: string;
};

async function getAdminAccessToken(): Promise<string> {
  let adminAccessToken = process.env.ADMIN_AT;
  if (adminAccessToken == null) {
    adminAccessToken = await baseURLRequest()
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: process.env.ADMIN_KEY,
        client_secret: process.env.ADMIN_SECRET,
      })
      .then((response) => response.body.access_token);

    if (!adminAccessToken) {
      throw new Error('Admin Access Token not found');
    }

    process.env.ADMIN_AT = adminAccessToken;
  }

  return adminAccessToken;
}

export const adminAccessToken: () => Promise<string> = memoize(getAdminAccessToken);

async function createClient(client: Credentials): Promise<Credentials> {
  return baseURLRequest()
    .post(`/oauth/client`)
    .send(client)
    .auth(await adminAccessToken(), { type: 'bearer' })
    .then((response) => {
      if (response.status !== 200 && response.status !== 201) {
        return Promise.reject(new Error(`Error creating client: ${response.body.message}`));
      }

      client.key = response.body.client_id;
      client.secret = response.body.client_secret;

      return client;
    });
}

async function getClientCredentials(requestedClient: Clients): Promise<Credentials> {
  let client: Credentials;

  switch (requestedClient) {
    case 'Vendor':
      if (process.env.VENDOR_KEY && process.env.VENDOR_SECRET) {
        client = {
          clientName: 'Automated Vendor',
          key: process.env.VENDOR_KEY,
          secret: process.env.VENDOR_SECRET,
          roles: ['vendor'],
        };
      } else {
        client = await createClient({
          clientName: 'Automated Vendor',
          roles: ['vendor'],
        });

        process.env.VENDOR_KEY = client.key;
        process.env.VENDOR_SECRET = client.secret;
      }
      break;
    case 'Host':
      if (process.env.HOST_KEY && process.env.HOST_SECRET) {
        client = {
          clientName: 'Automated Host',
          key: process.env.HOST_KEY,
          secret: process.env.HOST_SECRET,
          roles: ['host', 'assessment'],
        };
      } else {
        client = await createClient({
          clientName: 'Automated Host',
          roles: ['host', 'assessment'],
        });

        process.env.HOST_KEY = client.key;
        process.env.HOST_SECRET = client.secret;
      }
      break;
    case 'Admin':
      throw new Error('Admin client should be generated before execution');
    default:
      throw new Error('Specify desired client');
  }

  return client;
}

export async function getAccessToken(requestedClient: Clients): Promise<string> {
  const obtainedClient = await getClientCredentials(requestedClient);

  if (!obtainedClient.token) {
    const token = await baseURLRequest()
      .post('/oauth/token')
      .auth(await adminAccessToken(), { type: 'bearer' })
      .send({
        grant_type: 'client_credentials',
        client_id: obtainedClient.key,
        client_secret: obtainedClient.secret,
      })
      .then((response) => response.body.access_token);

    obtainedClient.token = token;
  }

  return obtainedClient.token ? obtainedClient.token : '';
}

async function createAdminClient(): Promise<{ key: string; secret: string }> {
  return baseURLRequest()
    .post(`/oauth/client`)
    .send({
      clientName: 'Admin Client',
      roles: ['admin'],
    })
    .then((response) => {
      if (response.status === 401) {
        return Promise.reject(new Error('Client already exists. Contact administrator for key and secret'));
      }

      if (response.status !== 201) {
        return Promise.reject(new Error('Unexpected error creating admin client'));
      }

      return {
        key: response.body.client_id,
        secret: response.body.client_secret,
      };
    });
}

function setCredentials({ key, secret }: { key: string; secret: string }) {
  process.env.ADMIN_KEY = key;
  process.env.ADMIN_SECRET = secret;
}

export async function createAutomationUsers(): Promise<void> {
  await getClientCredentials('Vendor');
  await getClientCredentials('Host');
}

export async function authenticateAdmin(): Promise<void> {
  if (!process.env.ADMIN_KEY && !process.env.ADMIN_SECRET) {
    const credentials = await createAdminClient();

    setCredentials(credentials);
  }
}
