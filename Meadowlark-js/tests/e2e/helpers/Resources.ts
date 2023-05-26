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
  accessToken = '',
  upsert = true,
}: {
  endpoint: string;
  body: Object;
  role?: Role;
  accessToken?: string;
  upsert?: boolean;
}): Promise<string> {
  return baseURLRequest()
    .post(`/v3.3b/ed-fi/${endpoint}`)
    .auth(accessToken || (await getAccessToken(role)), { type: 'bearer' })
    .send(body)
    .then((response) => {
      if (response.body) {
        console.error(`Error on ${endpoint}:\n${JSON.stringify(response.body)}`);
        expect(response.body).toMatchInlineSnapshot(`undefined`);
      }
      if (upsert) {
        expect([200, 201]).toContain(response.status);
      } else {
        expect(response.status).toEqual(201);
      }

      expect(response.headers.location).not.toBe(null);
      return response.headers.location;
    });
}

export async function deleteResourceByLocation(location: string, resourceName = 'resource'): Promise<void> {
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
  } else {
    console.warn(`⚠️ Unable to delete ${resourceName}. Location not found. Verify that resource was created correctly ⚠️`);
  }
}
