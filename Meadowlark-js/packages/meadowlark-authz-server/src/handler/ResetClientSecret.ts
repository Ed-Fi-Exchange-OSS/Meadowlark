// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import crypto from 'node:crypto';
import { writeErrorToLog } from '@edfi/meadowlark-utilities';
import { writeDebugObject, writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { ensurePluginsLoaded, getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';
import { validateAdminTokenForAccess } from '../security/TokenValidator';
import { clientIdFrom } from '../Utility';
import { AuthorizationRequest, extractAuthorizationHeader } from './AuthorizationRequest';
import { AuthorizationResponse } from './AuthorizationResponse';
import { ResetClientSecretResponseBody } from '../model/ResetClientSecretResponseBody';
import { ResetAuthorizationClientSecretResult } from '../message/ResetAuthorizationClientSecretResult';
import { ResetAuthorizationClientSecretRequest } from '../message/ResetAuthorizationClientSecretRequest';
import { hashClientSecretBuffer } from '../security/HashClientSecret';

const moduleName = 'authz.handler.UpdateClientSecret';

export async function resetAuthorizationClientSecret(
  authorizationRequest: AuthorizationRequest,
): Promise<AuthorizationResponse> {
  try {
    writeRequestToLog(moduleName, authorizationRequest, 'createClient');
    await ensurePluginsLoaded();

    const errorResponse: AuthorizationResponse | undefined = validateAdminTokenForAccess(
      extractAuthorizationHeader(authorizationRequest),
      authorizationRequest.traceId,
    );

    if (errorResponse != null) {
      writeDebugObject(moduleName, authorizationRequest, 'createClient', errorResponse.statusCode, errorResponse.body);
      return errorResponse;
    }

    const clientSecretBuffer: Buffer = crypto.randomBytes(32);
    const clientSecretHashed: string = hashClientSecretBuffer(clientSecretBuffer);

    const pathExpression = /\/(?<oauth>[^/]+)\/(?<client>[^/]+)\/((?<clientId>[^/]*))?\/((?<reset>[^/]*$))?/gm;
    const clientId = clientIdFrom(pathExpression, authorizationRequest.path);

    if (clientId === '') {
      const error = 'Missing client id';
      writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClient', 400, error);
      return { body: { error }, statusCode: 400 };
    }

    const updateSecretRequest: ResetAuthorizationClientSecretRequest = {
      clientId,
      clientSecretHashed,
      traceId: authorizationRequest.traceId,
    };

    const updateResult: ResetAuthorizationClientSecretResult =
      await getAuthorizationStore().resetAuthorizationClientSecret(updateSecretRequest);

    const { response } = updateResult;

    if (response === 'RESET_SUCCESS') {
      const responseBody: ResetClientSecretResponseBody = {
        client_id: clientId,
        client_secret: clientSecretBuffer.toString('hex'),
      };

      writeDebugStatusToLog(moduleName, authorizationRequest, 'resetAuthorizationClientSecret', 201);
      return { body: responseBody, statusCode: 201 };
    }

    if (response === 'RESET_FAILED_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'resetAuthorizationClientSecret', 404);
      return { statusCode: 404 };
    }

    writeDebugStatusToLog(moduleName, authorizationRequest, 'resetAuthorizationClientSecret', 500);
    return { statusCode: 500 };
  } catch (e) {
    writeErrorToLog(moduleName, authorizationRequest.traceId, 'resetAuthorizationClientSecret', 500, e);
    return { statusCode: 500 };
  }
}
