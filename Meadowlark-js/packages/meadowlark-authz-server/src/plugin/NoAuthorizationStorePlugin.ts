// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-core';
import { CreateClientRequest } from '../message/CreateClientRequest';
import { CreateClientResult } from '../message/CreateClientResult';
import { AuthorizationStorePlugin } from './AuthorizationStorePlugin';

export const NoAuthorizationStorePlugin: AuthorizationStorePlugin = {
  createAuthorizationClient: async (_request: CreateClientRequest): Promise<CreateClientResult> => {
    Logger.warn('NoAuthorizationStorePlugin.createClient(): No authorization store plugin has been configured', null);
    return Promise.resolve({ response: 'UNKNOWN_FAILURE' });
  },
};
