// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { baseURLRequest, rootURLRequest } from '../Setup';
import { getAccessToken, Clients } from './Credentials';

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

export async function deleteResourceByLocation(location: string): Promise<void> {
  if (location) {
    await rootURLRequest
      .delete(location)
      .auth(await getAccessToken(Clients.Host1), { type: 'bearer' })
      .expect(204);
  }
}
