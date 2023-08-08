// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import memoize from 'fast-memoize';
import { baseURLRequest } from './Shared';

export type Role = 'vendor' | 'host' | 'admin';

export type Credentials = {
  clientName: string;
  roles: Array<string>;
  key?: string;
  secret?: string;
  token?: string;
};

async function getAdminAccessToken(): Promise<string> {
  let adminAccessToken = process.env.ADMIN_AT;

  if (!adminAccessToken) {
    adminAccessToken = await baseURLRequest()
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: process.env.ADMIN_KEY,
        client_secret: process.env.ADMIN_SECRET,
      })
      .then((response) => {
        if (response.status !== 200) {
          return Promise.reject(new Error(`Error getting admin token: ${JSON.stringify(response.body)}`));
        }
        return response.body.access_token;
      });

    if (!adminAccessToken) {
      throw new Error('Admin Access Token not found');
    }

    process.env.ADMIN_AT = adminAccessToken;
  }

  return adminAccessToken;
}

export const adminAccessToken: () => Promise<string> = memoize(getAdminAccessToken);

export async function createClient(client: Credentials): Promise<Credentials> {
  return baseURLRequest()
    .post(`/oauth/clients`)
    .send(client)
    .auth(await adminAccessToken(), { type: 'bearer' })
    .then(async (response) => {
      if (response.status !== 200 && response.status !== 201) {
        return Promise.reject(new Error(`Error creating client: ${JSON.stringify(response.body)}`));
      }

      client.key = response.body.client_id;
      client.secret = response.body.client_secret;

      return client;
    });
}

export async function getClientCredentials(requestedClient: Role): Promise<Credentials> {
  let credentials: Credentials;

  switch (requestedClient) {
    case 'vendor':
      if (process.env.VENDOR_KEY && process.env.VENDOR_SECRET) {
        credentials = {
          clientName: 'Automated Vendor',
          key: process.env.VENDOR_KEY,
          secret: process.env.VENDOR_SECRET,
          roles: ['vendor'],
        };
      } else {
        credentials = await createClient({
          clientName: 'Automated Vendor',
          roles: ['vendor'],
        });

        process.env.VENDOR_KEY = credentials.key;
        process.env.VENDOR_SECRET = credentials.secret;
      }
      break;
    case 'host':
      if (process.env.HOST_KEY && process.env.HOST_SECRET) {
        credentials = {
          clientName: 'Automated Host',
          key: process.env.HOST_KEY,
          secret: process.env.HOST_SECRET,
          roles: ['host', 'assessment'],
        };
      } else {
        credentials = await createClient({
          clientName: 'Automated Host',
          roles: ['host', 'assessment'],
        });

        process.env.HOST_KEY = credentials.key;
        process.env.HOST_SECRET = credentials.secret;
      }
      break;
    case 'admin':
      // We don't want to check for env variables because those should be automatically set.
      // This case is for scenarios where we specifically need to create another admin user.
      credentials = await createClient({
        clientName: 'Automated Admin',
        roles: ['admin'],
      });

      process.env.HOST_KEY = credentials.key;
      process.env.HOST_SECRET = credentials.secret;

      break;
    default:
      throw new Error('Specify desired client');
  }

  return credentials;
}

export async function getAccessToken(requestedClient: Role): Promise<string> {
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
    .post(`/oauth/clients`)
    .send({
      clientName: 'Admin Client',
      roles: ['admin'],
    })
    .then(async (response) => {
      if (response.status === 401) {
        return Promise.reject(new Error('Client already exists. Contact administrator for key and secret'));
      }

      if (response.status !== 201) {
        return Promise.reject(new Error(`Unexpected error creating admin client ${JSON.stringify(response.body)}`));
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
  await getClientCredentials('vendor');
  await getClientCredentials('host');
  console.debug('-- Automation Users Created --');
}

export async function authenticateAdmin(): Promise<void> {
  try {
    const hasExistingClient = process.env.ADMIN_KEY && process.env.ADMIN_SECRET;

    if (process.env.USE_EXISTING_ENVIRONMENT) {
      if (process.env.OAUTH_HARD_CODED_CREDENTIALS_ENABLED) {
        process.env.ADMIN_KEY = 'meadowlark_admin_key_1';
        process.env.ADMIN_SECRET = 'meadowlark_admin_secret_1';
      } else {
        await Promise.reject(
          new Error('Enable hardcoded credentials or set the ADMIN_KEY and ADMIN_SECRET of a user with role admin'),
        );
      }

      await getAdminAccessToken();
    } else if (process.env.DEVELOPER_MODE && hasExistingClient) {
      console.info('INFO ℹ️: Using existing admin key and secret');
      await getAdminAccessToken();
    } else {
      const credentials = await createAdminClient();
      if (process.env.DEVELOPER_MODE && !hasExistingClient) {
        console.info('INFO ℹ️: Add the following values to the .env file.');
        console.info('If not saved, tests cannot be executed again until cleaning the environment.');
        console.info(`ADMIN_KEY=${credentials.key}`);
        console.info(`ADMIN_SECRET=${credentials.secret}`);
      }
      setCredentials(credentials);
    }
    console.debug('-- Admin Authenticated --');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
