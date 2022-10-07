// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { authorizationHeader, Logger } from '@edfi/meadowlark-core';
import { UpdateAuthorizationClientRequest } from '../message/UpdateAuthorizationClientRequest';
import { UpdateAuthorizationClientResult } from '../message/UpdateAuthorizationClientResult';
import { UpdateClientBody } from '../model/CreateClientBody';
import { ensurePluginsLoaded, getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';
import { checkForAuthorizationErrors } from '../security/JwtValidator';
import { AuthorizationRequest } from './AuthorizationRequest';
import { AuthorizationResponse } from './AuthorizationResponse';
import { BodyValidation, validateUpdateClientBody } from '../validation/ValidateBody';
import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';

const moduleName = 'handler.UpdateClient';

function clientIdFrom(path: string): string {
  return path.split('/').pop()?.split('?')[0] ?? '';
}

/**
 * Handler for client update
 */
export async function updateClient(authorizationRequest: AuthorizationRequest): Promise<AuthorizationResponse> {
  try {
    writeRequestToLog(moduleName, authorizationRequest, 'updateClient');
    await ensurePluginsLoaded();

    const errorResponse: AuthorizationResponse | undefined = checkForAuthorizationErrors(
      authorizationHeader(authorizationRequest.headers),
    );

    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClient', errorResponse.statusCode, errorResponse.body);
      return errorResponse;
    }

    const clientId: string = clientIdFrom(authorizationRequest.path);
    if (clientId === '') {
      const message = 'Missing client id';
      writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClient', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    if (authorizationRequest.body == null) {
      const message = 'Missing body';
      writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClient', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    let parsedBody: any = {};
    try {
      parsedBody = JSON.parse(authorizationRequest.body);
    } catch (error) {
      const message = 'Malformed body';
      writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClient', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    const validation: BodyValidation = validateUpdateClientBody(parsedBody);
    if (!validation.isValid) {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClient', 400, validation.failureMessage);
      return {
        body: validation.failureMessage,
        statusCode: 400,
      };
    }

    const updateClientBody: UpdateClientBody = parsedBody as UpdateClientBody;

    const updateRequest: UpdateAuthorizationClientRequest = {
      ...updateClientBody,
      clientId,
      traceId: authorizationRequest.traceId,
    };

    const updateResult: UpdateAuthorizationClientResult = await getAuthorizationStore().updateAuthorizationClient(
      updateRequest,
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

    writeDebugStatusToLog(moduleName, authorizationRequest, 'updateClient', 500);
    Logger.debug(`${moduleName}.createAuthorization 500`, authorizationRequest.traceId);
    return { body: '', statusCode: 500 };
  } catch (e) {
    writeErrorToLog(moduleName, authorizationRequest.traceId, 'updateClient', 500, e);
    return { body: '', statusCode: 500 };
  }
}
