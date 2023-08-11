// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getBearerToken } from './BearerToken';
import { autocannonSchools, postRequiredSchoolReferences } from './AutocannonSchools';

const URL_PREFIX = 'http://localhost:3000';

jest.setTimeout(100000);

describe('when autocannon-ing a bunch of Schools', () => {
  it('should have a low median latency', async () => {
    const bearerToken: string = await getBearerToken(URL_PREFIX);
    await postRequiredSchoolReferences({ bearerToken, urlPrefix: URL_PREFIX });
    const result = await autocannonSchools({ bearerToken, urlPrefix: URL_PREFIX });

    expect(result.latency.p50).toBeLessThan(500);
  });
});
