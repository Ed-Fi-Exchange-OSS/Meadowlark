// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Role, getAccessToken } from './Credentials';
import { baseURLRequest, rootURLRequest } from './Shared';

export async function createResource({
  endpoint,
  body,
  role = 'vendor',
}: {
  endpoint: string;
  body: Object;
  role?: Role;
}): Promise<string> {
  return baseURLRequest()
    .post(`/v3.3b/ed-fi/${endpoint}`)
    .auth(await getAccessToken(role), { type: 'bearer' })
    .send(body)
    .then((response) => {
      if (response.body) {
        console.error(`Error on ${endpoint}:\n${response.body}`);
        expect(response.body).toBeUndefined();
      }
      expect(response.status).toEqual(201);

      expect(response.headers.location).not.toBe(null);
      return response.headers.location;
    });
}

export async function deleteResourceByLocation(location: string): Promise<void> {
  if (location) {
    await rootURLRequest()
      .delete(location)
      .auth(await getAccessToken('host'), { type: 'bearer' })
      .then((response) => {
        if (response.body) {
          console.error(response.body);
        }
        expect(response.status).toEqual(204);
      });
  }
}
