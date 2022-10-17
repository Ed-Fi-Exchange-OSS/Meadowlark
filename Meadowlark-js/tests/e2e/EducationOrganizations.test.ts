// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken, Clients } from './functions/Credentials';
import { baseURLRequest } from './Setup';

describe('Education Organizations', () => {
  it("shouldn't allow to post to abstract entity", async () => {
    await baseURLRequest
      .post('/v3.3b/ed-fi/educationOrganizations')
      .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
      .send({
        schoolId: 123,
        categories: [],
        gradeLevels: [],
      })
      .expect(404);
  });
});
