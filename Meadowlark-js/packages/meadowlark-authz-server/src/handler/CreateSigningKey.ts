// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import crypto from 'node:crypto';
import { AuthorizationRequest } from './AuthorizationRequest';
import { AuthorizationResponse } from './AuthorizationResponse';
import { writeRequestToLog } from '../Logger';

const moduleName = 'authz.handler.CreateSigningKey';

/**
 * Handler for client creation
 */
export async function createSigningKey(authorizationRequest: AuthorizationRequest): Promise<AuthorizationResponse> {
  writeRequestToLog(moduleName, authorizationRequest, 'createSigningKey');
  return {
    body: JSON.stringify({ key: crypto.randomBytes(256).toString('base64') }),
    statusCode: 201,
  };
}
