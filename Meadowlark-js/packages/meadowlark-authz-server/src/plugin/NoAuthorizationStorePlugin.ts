// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-core';
import { CreateAuthorizationClientRequest } from '../message/CreateAuthorizationClientRequest';
import { CreateAuthorizationClientResult } from '../message/CreateAuthorizationClientResult';
import { UpdateAuthorizationClientRequest } from '../message/UpdateAuthorizationClientRequest';
import { UpdateAuthorizationClientResult } from '../message/UpdateAuthorizationClientResult';
import { AuthorizationStorePlugin } from './AuthorizationStorePlugin';

export const NoAuthorizationStorePlugin: AuthorizationStorePlugin = {
  createAuthorizationClient: async (
    _request: CreateAuthorizationClientRequest,
  ): Promise<CreateAuthorizationClientResult> => {
    Logger.error('NoAuthorizationStorePlugin.createClient(): An authorization store plugin has not been configured', null);
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
};
