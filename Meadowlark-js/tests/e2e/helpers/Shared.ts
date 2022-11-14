// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import Chance from 'chance';
import request from 'supertest';
import { Clients, getAccessToken } from './Credentials';

const chance = new Chance() as Chance.Chance;

export function baseURLRequest() {
  return request(process.env.BASE_URL);
}

export function rootURLRequest() {
  return request(process.env.ROOT_URL);
}

export function generateRandomId(length = 12): string {
  return chance.hash({ length });
}

export function generateGuid(): string {
  return chance.guid();
}

export async function getDescriptorByLocation(location: string): Promise<string> {
  return rootURLRequest()
    .get(location)
    .auth(await getAccessToken(Clients.Host), { type: 'bearer' })
    .expect(200)
    .then((response) => {
      expect(response.body).not.toBe(null);
      return `${response.body.namespace}#${response.body.description}`;
    });
}
