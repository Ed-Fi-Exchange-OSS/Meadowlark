// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { CreateAuthorizationClientRequest } from '../message/CreateAuthorizationClientRequest';
import { CreateAuthorizationClientResult } from '../message/CreateAuthorizationClientResult';
import { GetAuthorizationClientRequest } from '../message/GetAuthorizationClientRequest';
import { GetAuthorizationClientResult } from '../message/GetAuthorizationClientResult';
import { UpdateAuthorizationClientRequest } from '../message/UpdateAuthorizationClientRequest';
import { UpdateAuthorizationClientResult } from '../message/UpdateAuthorizationClientResult';
import { ResetAuthorizationClientSecretResult } from '../message/ResetAuthorizationClientSecretResult';
import { ResetAuthorizationClientSecretRequest } from '../message/ResetAuthorizationClientSecretRequest';
import { TryCreateBootstrapAuthorizationAdminResult } from '../message/TryCreateBootstrapAuthorizationAdminResult';
import { GetAllAuthorizationClientsResult } from '../message/GetAllAuthorizationClientsResult';

export interface AuthorizationStorePlugin {
  createAuthorizationClient: (request: CreateAuthorizationClientRequest) => Promise<CreateAuthorizationClientResult>;
  tryCreateBootstrapAuthorizationAdmin: (
    request: CreateAuthorizationClientRequest,
  ) => Promise<TryCreateBootstrapAuthorizationAdminResult>;
  getAllAuthorizationClients: (traceId: string) => Promise<GetAllAuthorizationClientsResult>;
  getAuthorizationClient: (request: GetAuthorizationClientRequest) => Promise<GetAuthorizationClientResult>;
  updateAuthorizationClient: (request: UpdateAuthorizationClientRequest) => Promise<UpdateAuthorizationClientResult>;
  resetAuthorizationClientSecret: (
    request: ResetAuthorizationClientSecretRequest,
  ) => Promise<ResetAuthorizationClientSecretResult>;
}
