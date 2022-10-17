// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import crypto from 'node:crypto';
import { authorizationHeader, writeErrorToLog } from '@edfi/meadowlark-core';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { ensurePluginsLoaded, getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';
import { checkForAuthorizationErrors } from '../security/JwtValidator';
import { clientIdFrom } from '../Utility';
import { AuthorizationRequest } from './AuthorizationRequest';
import { AuthorizationResponse } from './AuthorizationResponse';
import { ResetClientSecretResponseBody } from '../model/ResetClientSecretResponseBody';
import { ResetAuthorizationClientSecretResult } from '../message/ResetAuthorizationClientSecretResult';
import { ResetAuthorizationClientSecretRequest } from '../message/ResetAuthorizationClientSecretRequest';
import { hashClientSecretBuffer } from '../security/HashClientSecret';

const moduleName = 'handler.UpdateClientSecret';

export async function resetAuthorizationClientSecret(
  authorizationRequest: AuthorizationRequest,
): Promise<AuthorizationResponse> {
  try {
    writeRequestToLog(moduleName, authorizationRequest, 'createClient');
    await ensurePluginsLoaded();

    const errorResponse: AuthorizationResponse | undefined = checkForAuthorizationErrors(
      authorizationHeader(authorizationRequest.headers),
    );

    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'createClient', errorResponse.statusCode, errorResponse.body);
      return errorResponse;
    }

    const clientSecretBuffer: Buffer = crypto.randomBytes(32);
    const clientSecretHashed: string = hashClientSecretBuffer(clientSecretBuffer);

    const pathExpression = /\/(?<oauth>[^/]+)\/(?<client>[^/]+)\/((?<clientId>[^/]*))?\/((?<reset>[^/]*$))?/gm;
    const clientId = clientIdFrom(pathExpression, authorizationRequest.path);

    if (clientId === '') {
      const message = 'Missing client id';
      writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClient', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    const updateSecretRequest: ResetAuthorizationClientSecretRequest = {
      clientId,
      clientSecretHashed,
      traceId: authorizationRequest.traceId,
    };

    const updateResult: ResetAuthorizationClientSecretResult = await getAuthorizationStore().resetAuthorizationClientSecret(
      updateSecretRequest,
    );

    const { response } = updateResult;

    if (response === 'RESET_SUCCESS') {
      const responseBody: ResetClientSecretResponseBody = {
        client_id: clientId,
        client_secret: clientSecretHashed,
      };

      writeDebugStatusToLog(moduleName, authorizationRequest, 'resetAuthorizationClientSecret', 201);
      return { body: JSON.stringify(responseBody), statusCode: 201 };
    }

    if (response === 'RESET_FAILED_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'resetAuthorizationClientSecret', 404);
      return { body: '', statusCode: 404 };
    }

    writeDebugStatusToLog(moduleName, authorizationRequest, 'resetAuthorizationClientSecret', 500);
    return { body: '', statusCode: 500 };
  } catch (e) {
    writeErrorToLog(moduleName, authorizationRequest.traceId, 'resetAuthorizationClientSecret', 500, e);
    return { body: '', statusCode: 500 };
  }
}
