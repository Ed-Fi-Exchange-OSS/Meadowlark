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

export interface AuthorizationStorePlugin {
  createAuthorizationClient: (request: CreateAuthorizationClientRequest) => Promise<CreateAuthorizationClientResult>;
  getAuthorizationClient: (request: GetAuthorizationClientRequest) => Promise<GetAuthorizationClientResult>;
  updateAuthorizationClient: (request: UpdateAuthorizationClientRequest) => Promise<UpdateAuthorizationClientResult>;
}
