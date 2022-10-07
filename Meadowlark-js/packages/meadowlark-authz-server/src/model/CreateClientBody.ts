// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { AuthorizationClientRole } from './AuthorizationClientRole';

export type CreateClientBody = {
  clientName: string;
  roles: AuthorizationClientRole[];
};

export const createClientBodySchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Create body',
  description: 'The body of a POST to create a client',
  type: 'object',
  properties: {
    clientName: {
      description: 'Client name',
      type: 'string',
    },
    roles: {
      type: 'array',
      items: {
        description: 'List of roles',
        type: 'string',
        enum: ['vendor', 'host', 'admin', 'assessment'],
      },
      uniqueItems: true,
      minItems: 1,
      maxItems: 2,
      contains: {
        type: 'string',
        enum: ['vendor', 'host', 'admin'],
      },
      maxContains: 1,
    },
  },
  required: ['clientName', 'roles'],
  additionalProperties: false,
};
