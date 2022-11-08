// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { chance, rootURLRequest } from '../Setup';
import { Clients, getAccessToken } from './Credentials';

export function generateRandomId(length = 12): string {
  return chance.hash({ length });
}

export function generateGuid(): string {
  return chance.guid();
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
