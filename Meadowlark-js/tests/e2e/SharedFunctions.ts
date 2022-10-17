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

export enum Clients {
  Vendor1,
  Vendor2,
  Host1,
  Assessment1,
}

export const baseURLRequest = request(process.env.BASE_URL);
export const rootURLRequest = request(process.env.ROOT_URL);

export const accessTokens: Array<{ client: Clients; token: string }> = [];

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

export function generateRandomId(length = 12): string {
  return chance.hash({ length });
}

/* TEMPORARY LOCATION */
export async function createResource({
  endpoint,
  body,
  credentials = Clients.Vendor1,
}: {
  endpoint: string;
  body: Object;
  credentials?: Clients;
}): Promise<string> {
  return baseURLRequest
    .post(`/v3.3b/ed-fi/${endpoint}`)
    .auth(await getAccessToken(credentials), { type: 'bearer' })
    .send(body)
    .expect(201)
    .then((response) => {
      expect(response.headers.location).not.toBe(null);
      return response.headers.location;
    });
}

export async function createContentClassDescriptor(): Promise<string> {
  return createResource({
    endpoint: 'contentClassDescriptors',
    credentials: Clients.Host1,
    body: {
      codeValue: 'Presentation',
      shortDescription: 'Presentation',
      description: 'Presentation',
      namespace: 'uri://ed-fi.org/ContentClassDescriptor',
    },
  });
}

export async function createCountry(): Promise<string> {
  return createResource({
    endpoint: 'countryDescriptors',
    credentials: Clients.Host1,
    body: {
      codeValue: 'US',
      shortDescription: 'US',
      description: 'US',
      namespace: 'uri://ed-fi.org/CountryDescriptor',
    },
  });
}

export async function createSchool(schoolId: number): Promise<string> {
  // Using assessment credentials to bypass strict validation
  return createResource({
    endpoint: 'schools',
    credentials: Clients.Assessment1,
    body: {
      schoolId,
      nameOfInstitution: 'New School',
      educationOrganizationCategories: [
        {
          educationOrganizationCategoryDescriptor: 'uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other',
        },
      ],
      schoolCategories: [
        {
          schoolCategoryDescriptor: 'uri://ed-fi.org/SchoolCategoryDescriptor#All Levels',
        },
      ],
      gradeLevels: [
        {
          gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#First Grade',
        },
      ],
    },
  });
}

export async function getDescriptorByLocation(location: string): Promise<string> {
  return rootURLRequest
    .get(location)
    .auth(await getAccessToken(Clients.Host1), { type: 'bearer' })
    .expect(200)
    .then((response) => {
      expect(response.body).not.toBe(null);
      return `${response.body.namespace}#${response.body.description}`;
    });
}

export async function deleteByLocation(location: string): Promise<void> {
  if (location) {
    await rootURLRequest
      .delete(location)
      .auth(await getAccessToken(Clients.Host1), { type: 'bearer' })
      .expect(204);
  }
}
/* TEMPORARY LOCATION */
