// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import secureRandom from 'secure-random';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

/*
 * Creates an encoded 256 bit key appropriate for signing JWTs.
 */
export async function createRandomSigningKey(): Promise<FrontendResponse> {
  return {
    body: JSON.stringify({ key: secureRandom(256, { type: 'Buffer' }).toString('base64') }),
    statusCode: 201,
  };
}

/*
 * Single point of entry for both functions.
 */
export async function handler(_frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  return createRandomSigningKey();
}
