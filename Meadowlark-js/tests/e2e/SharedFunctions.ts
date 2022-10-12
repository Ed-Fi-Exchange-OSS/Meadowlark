// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import path from 'path';
import dotenv from 'dotenv';
import request from 'supertest';
import Chance from 'chance';

// Setup
const chance = new Chance() as Chance.Chance;
dotenv.config({ path: path.join(__dirname, './.env') });

interface Credentials {
  key: string | undefined;
  secret: string | undefined;
}

export const baseURLRequest = request(process.env.BASE_URL);
export const rootURLRequest = request(process.env.ROOT_URL);

export const accessTokens: Array<{ client: string; token: string }> = [];

// TBD: Find a better way to handle credentials. This will change with RND-93
function getCredentials(client: string): Credentials {
  let credentials: Credentials;
  switch (client) {
    case 'client4':
      credentials = {
        key: process.env.CLIENT_KEY_4,
        secret: process.env.CLIENT_SECRET_4,
      };
      break;
    case 'admin1':
      credentials = {
        key: process.env.ADMIN_KEY_1,
        secret: process.env.ADMIN_SECRET_1,
      };
      break;
    case 'client1':
      credentials = {
        key: process.env.CLIENT_KEY_1,
        secret: process.env.CLIENT_SECRET_1,
      };
      break;
    default:
      throw new Error('Specify desired client');
  }

  return credentials;
}

export async function getAccessToken(client: string): Promise<string> {
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

export function generateRandomId(length = 12): string {
  return chance.hash({ length });
}

/* TEMPORAL LOCATION */
export async function createContentClassDescriptor(): Promise<string> {
  return baseURLRequest
    .post(`/v3.3b/ed-fi/contentClassDescriptors`)
    .auth(await getAccessToken('client1'), { type: 'bearer' })
    .send({
      codeValue: 'Presentation',
      shortDescription: 'Presentation',
      description: 'Presentation',
      namespace: 'uri://ed-fi.org/ContentClassDescriptor',
    })
    .expect(200)
    .then((response) => {
      expect(response.headers.location).not.toBe(null);
      return response.headers.location;
    });
}

export async function createCountry(): Promise<string> {
  return baseURLRequest
    .post('/v3.3b/ed-fi/countryDescriptors')
    .auth(await getAccessToken('client1'), { type: 'bearer' })
    .send({
      codeValue: 'US',
      shortDescription: 'US',
      description: 'US',
      namespace: 'uri://ed-fi.org/CountryDescriptor',
    })
    .expect(201)
    .then((response) => {
      expect(response.headers.location).not.toBe(null);
      return response.headers.location;
    });
}

export async function getDescriptorByLocation(location: string): Promise<string> {
  return rootURLRequest
    .get(location)
    .auth(await getAccessToken('client1'), { type: 'bearer' })
    .expect(200)
    .then((response) => {
      expect(response.body).not.toBe(null);
      return `${response.body.namespace}#${response.body.description}`;
    });
}

export async function deleteByLocation(location: string, client = 'client1'): Promise<void> {
  // Should be admin
  await rootURLRequest
    .delete(location)
    .auth(await getAccessToken(client), { type: 'bearer' })
    .expect(204);
}
/* TEMPORAL LOCATION */
