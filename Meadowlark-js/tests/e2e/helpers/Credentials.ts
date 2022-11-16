// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import memoize from 'fast-memoize';
import { baseURLRequest } from './Shared';

// eslint-disable-next-line no-shadow
export enum Clients {
  Vendor,
  Host,
  Admin,
}

type Credentials = {
  clientName: string;
  roles: Array<string>;
  key?: string;
  secret?: string;
  token?: string;
};

const clients = new Map<Clients, Credentials>();

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

async function getClient(requestedClient: Clients): Promise<Credentials> {
  let client: Credentials = clients.get(requestedClient)!;

  if (!client) {
    switch (requestedClient) {
      case Clients.Vendor:
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
        }
        break;
      case Clients.Host:
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
        }
        break;
      case Clients.Admin:
        throw new Error('Admin client should be generated before execution');
      default:
        throw new Error('Specify desired client');
    }

    clients.set(requestedClient, client);
  }

  return client;
}

export async function getAccessToken(requestedClient: Clients): Promise<string> {
  const client = await getClient(requestedClient);

  if (!client.token) {
    const token = await baseURLRequest()
      .post('/oauth/token')
      .auth(await adminAccessToken(), { type: 'bearer' })
      .send({
        grant_type: 'client_credentials',
        client_id: client.key,
        client_secret: client.secret,
      })
      .then((response) => response.body.access_token);

    client.token = token;

    clients.set(requestedClient, client);
  }

  return client.token ? client.token : '';
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

export async function authenticateAdmin(): Promise<void> {
  if (!process.env.ADMIN_KEY && !process.env.ADMIN_SECRET) {
    const credentials = await createAdminClient();

    setCredentials(credentials);
  }
}
