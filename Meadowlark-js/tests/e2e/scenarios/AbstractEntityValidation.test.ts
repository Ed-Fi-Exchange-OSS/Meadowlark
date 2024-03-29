// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { baseURLRequest } from '../helpers/Shared';

describe('given an abstract entity', () => {
  it('does not allow a post request', async () => {
    await baseURLRequest()
      .post('/v3.3b/ed-fi/educationOrganizations')
      .auth(await getAccessToken('vendor'), { type: 'bearer' })
      .send({
        schoolId: 123,
        categories: [],
        gradeLevels: [],
      })
      .expect(404);
  });
});
