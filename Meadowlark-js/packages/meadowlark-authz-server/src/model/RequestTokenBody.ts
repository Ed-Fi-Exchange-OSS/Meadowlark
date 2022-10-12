// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export type RequestTokenBody = { grant_type: string; client_id: string; client_secret: string };

/**
 * Body must have grant_type, and optionally BOTH client_id and client_secret
 */
export const requestTokenBodySchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Request token body',
  description: 'The body of a POST to request a Meadowlark OAuth token',
  type: 'object',
  properties: {
    grant_type: {
      description: 'Grant type',
      type: 'string',
      enum: ['client_credentials'],
    },
    client_id: {
      description: 'Client id',
      type: 'string',
    },
    client_secret: {
      description: 'Client secret',
      type: 'string',
    },
  },
  required: ['grant_type'],
  oneOf: [
    { required: ['client_id', 'client_secret'] },
    {
      allOf: [{ not: { required: ['client_id'] } }, { not: { required: ['client_secret'] } }],
    },
  ],
  additionalProperties: false,
};
