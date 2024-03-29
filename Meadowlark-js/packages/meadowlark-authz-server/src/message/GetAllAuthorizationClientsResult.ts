// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { GetClientBody } from '../model/ClientBody';

export type GetAllAuthorizationClientsResult =
  | {
      response: 'GET_SUCCESS' | 'UNKNOWN_FAILURE';
      clients: GetClientBody[];
    }
  | { response: 'GET_FAILURE_NOT_EXISTS' }
  | { response: 'UNKNOWN_FAILURE' };
