// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import { CreateAuthorizationClientRequest } from '../message/CreateAuthorizationClientRequest';
import { CreateAuthorizationClientResult } from '../message/CreateAuthorizationClientResult';
import { GetAuthorizationClientRequest } from '../message/GetAuthorizationClientRequest';
import { GetAuthorizationClientResult } from '../message/GetAuthorizationClientResult';
import { UpdateAuthorizationClientRequest } from '../message/UpdateAuthorizationClientRequest';
import { UpdateAuthorizationClientResult } from '../message/UpdateAuthorizationClientResult';
import { ResetAuthorizationClientSecretResult } from '../message/ResetAuthorizationClientSecretResult';
import { AuthorizationStorePlugin } from './AuthorizationStorePlugin';
import { ResetAuthorizationClientSecretRequest } from '../message/ResetAuthorizationClientSecretRequest';
import { TryCreateBootstrapAuthorizationAdminResult } from '../message/TryCreateBootstrapAuthorizationAdminResult';
import { GetAllAuthorizationClientsResult } from '../message/GetAllAuthorizationClientsResult';

export const NoAuthorizationStorePlugin: AuthorizationStorePlugin = {
  createAuthorizationClient: async (
    _request: CreateAuthorizationClientRequest,
  ): Promise<CreateAuthorizationClientResult> => {
    Logger.error(
      'NoAuthorizationStorePlugin.createAuthorizationClient(): An authorization store plugin has not been configured',
      null,
    );
    return Promise.resolve({ response: 'UNKNOWN_FAILURE' });
  },
  tryCreateBootstrapAuthorizationAdmin: async (
    _request: CreateAuthorizationClientRequest,
  ): Promise<TryCreateBootstrapAuthorizationAdminResult> => {
    Logger.error(
      'NoAuthorizationStorePlugin.tryCreateBootstrapAuthorizationAdmin(): An authorization store plugin has not been configured',
      null,
    );
    return Promise.resolve({ response: 'UNKNOWN_FAILURE' });
  },
  getAuthorizationClient: async (_request: GetAuthorizationClientRequest): Promise<GetAuthorizationClientResult> => {
    Logger.error(
      'NoAuthorizationStorePlugin.getAuthorizationClient(): An authorization store plugin has not been configured',
      null,
    );
    return Promise.resolve({ response: 'UNKNOWN_FAILURE' });
  },
  updateAuthorizationClient: async (
    _request: UpdateAuthorizationClientRequest,
  ): Promise<UpdateAuthorizationClientResult> => {
    Logger.warn(
      'NoAuthorizationStorePlugin.updateAuthorizationClient(): No authorization store plugin has been configured',
      null,
    );
    return Promise.resolve({ response: 'UNKNOWN_FAILURE' });
  },
  resetAuthorizationClientSecret: async (
    _request: ResetAuthorizationClientSecretRequest,
  ): Promise<ResetAuthorizationClientSecretResult> => {
    Logger.warn('NoAuthorizationStorePlugin.updateClientSecret(): No authorization store plugin has been configured', null);
    return Promise.resolve({ response: 'UNKNOWN_FAILURE' });
  },
  getAllAuthorizationClients: async (_traceId: string): Promise<GetAllAuthorizationClientsResult> => {
    Logger.error(
      'NoAuthorizationStorePlugin.getAllAuthorizationClients(): An authorization store plugin has not been configured',
      null,
    );
    return Promise.resolve({ response: 'UNKNOWN_FAILURE' });
  },
};
