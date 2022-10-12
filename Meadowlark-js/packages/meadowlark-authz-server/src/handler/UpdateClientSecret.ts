// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import crypto from 'node:crypto';
import { authorizationHeader, writeErrorToLog } from '@edfi/meadowlark-core';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { UpdateAuthorizationClientSecretRequest } from '../message/UpdateClientSecretRequest';
import { ensurePluginsLoaded, getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';
import { checkForAuthorizationErrors } from '../security/JwtValidator';
import { clientIdFrom } from '../Utility';
import { AuthorizationRequest } from './AuthorizationRequest';
import { AuthorizationResponse } from './AuthorizationResponse';
import { UpdateAuthorizationClientResult } from '../message/UpdateAuthorizationClientResult';

const moduleName = 'handler.UpdateClientSecret';

export async function updateAuthorizationClientSecret(
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

    const clientSecretBytes: Buffer = crypto.randomBytes(32);
    const clientSecretHashed: string = crypto.createHash('shake256').update(clientSecretBytes).digest('hex');

    const clientId = clientIdFrom(authorizationRequest.path);

    if (clientId === '') {
      const message = 'Missing client id';
      writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClient', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    const updateSecretRequest: UpdateAuthorizationClientSecretRequest = {
      clientId,
      clientSecret: clientSecretHashed,
      traceId: authorizationRequest.traceId,
    };

    const updateResult: UpdateAuthorizationClientResult = await getAuthorizationStore().updateAuthorizationClientSecret(
      updateSecretRequest,
    );

    const { response } = updateResult;

    if (response === 'UPDATE_SUCCESS') {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClient', 204);
      return { body: '', statusCode: 204 };
    }

    if (response === 'UPDATE_FAILED_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClient', 404);
      return { body: '', statusCode: 404 };
    }

    writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClientSecret', 500);
    return { body: '', statusCode: 500 };
  } catch (e) {
    writeErrorToLog(moduleName, authorizationRequest.traceId, 'updateClient', 500, e);
    return { body: '', statusCode: 500 };
  }
}
