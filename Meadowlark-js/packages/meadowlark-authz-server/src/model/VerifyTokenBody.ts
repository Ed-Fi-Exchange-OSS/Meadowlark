// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export type VerifyTokenBody = { token: string };

/**
 * Body must have token, and optionally token_type
 */
export const verifyTokenBodySchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Verify token body',
  description: 'The body of a POST to verify a Meadowlark OAuth token, as JSON',
  type: 'object',
  properties: {
    token: {
      description: 'The token to verify',
      type: 'string',
    },
    token_type: {
      description: 'Optional token_type. Unused.',
      type: 'string',
    },
  },
  required: ['token'],
  additionalProperties: false,
};
