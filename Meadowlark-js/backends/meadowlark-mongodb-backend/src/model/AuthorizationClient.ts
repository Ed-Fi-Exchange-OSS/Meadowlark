// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { ClientRole, CreateClientRequest } from '@edfi/meadowlark-authz-server';

export interface AuthorizationClient {
  /**
   * The clientId GUID. This field replaces the built-in MongoDB _id.
   */
  _id: string;

  /**
   * The 256-bit hex client secret.
   */
  clientSecret: string;

  /**
   * The client name
   */
  clientName: string;

  /**
   * A list of client roles
   */
  roles: ClientRole[];
}

export function authorizationClientFrom(request: CreateClientRequest): AuthorizationClient {
  return {
    _id: request.clientId,
    clientSecret: request.clientSecret,
    clientName: request.clientName,
    roles: request.roles,
  };
}
