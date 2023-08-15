// Copied from mongodb backend by MaxP

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { AuthorizationClientRole, CreateAuthorizationClientRequest } from '@edfi/meadowlark-authz-server';

export interface AuthorizationDocument {
  /**
   * The clientId uuid. This field replaces the built-in MongoDB _id.
   */
  _id: string;

  /**
   * A SHAKE-256 hex hash of the client secret.
   */
  clientSecretHashed: string;

  /**
   * The client name
   */
  clientName: string;

  /**
   * A list of client roles
   */
  roles: AuthorizationClientRole[];

  /**
   * Whether this is the initial admin account created by bootstrapping
   */
  isBootstrapAdmin: boolean;

  /**
   * Whether a client is active or not
   */
  active: boolean;
}

export function authorizationDocumentFromCreate(
  request: CreateAuthorizationClientRequest,
  isBootstrapAdmin: boolean = false,
): AuthorizationDocument {
  return {
    _id: request.clientId,
    clientSecretHashed: request.clientSecretHashed,
    clientName: request.clientName,
    roles: request.roles,
    active: request.active,
    isBootstrapAdmin,
  };
}

export function bootstrapAdminDocumentFromCreate(request: CreateAuthorizationClientRequest): AuthorizationDocument {
  return authorizationDocumentFromCreate(request, true);
}
