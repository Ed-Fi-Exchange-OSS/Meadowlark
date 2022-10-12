// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { CreateAuthorizationClientRequest } from '../message/CreateAuthorizationClientRequest';
import { CreateAuthorizationClientResult } from '../message/CreateAuthorizationClientResult';
import { UpdateAuthorizationClientRequest } from '../message/UpdateAuthorizationClientRequest';
import { UpdateAuthorizationClientResult } from '../message/UpdateAuthorizationClientResult';
import { UpdateAuthorizationClientSecretResult } from '../message/UpdateAuthorizationClientSecretResult';
import { UpdateAuthorizationClientSecretRequest } from '../message/UpdateClientSecretRequest';

export interface AuthorizationStorePlugin {
  createAuthorizationClient: (request: CreateAuthorizationClientRequest) => Promise<CreateAuthorizationClientResult>;
  updateAuthorizationClient: (request: UpdateAuthorizationClientRequest) => Promise<UpdateAuthorizationClientResult>;
  updateAuthorizationClientSecret: (request: UpdateAuthorizationClientSecretRequest) => Promise<UpdateAuthorizationClientSecretResult>;
}
