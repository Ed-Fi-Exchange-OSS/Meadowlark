// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { authorizationHeader, LOCATION_HEADER_NAME, Logger } from '@edfi/meadowlark-core';
import { CreateAuthorizationClientRequest } from '../message/CreateAuthorizationClientRequest';
import { CreateAuthorizationClientResult } from '../message/CreateAuthorizationClientResult';
import { CreateClientBody } from '../model/CreateClientBody';
import { ensurePluginsLoaded, getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';
import { checkForAuthorizationErrors } from '../security/JwtValidator';
import { AuthorizationRequest } from './AuthorizationRequest';
import { AuthorizationResponse } from './AuthorizationResponse';
import { validateCreateClientBody } from '../validation/ValidateClientBody';
import { CreateClientResponseBody } from '../model/CreateClientResponseBody';
import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
import { BodyValidation } from '../validation/BodyValidation';
import { hashClientSecretBuffer } from '../security/HashClentSecret';

const moduleName = 'handler.CreateClient';

/**
 * Handler for client creation
 */
export async function createClient(authorizationRequest: AuthorizationRequest): Promise<AuthorizationResponse> {
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

    if (authorizationRequest.body == null) {
      const message = 'Missing body';
      writeDebugStatusToLog(moduleName, authorizationRequest, 'createClient', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    let parsedBody: any = {};
    try {
      parsedBody = JSON.parse(authorizationRequest.body);
    } catch (error) {
      const message = 'Malformed body';
      writeDebugStatusToLog(moduleName, authorizationRequest, 'createClient', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    const validation: BodyValidation = validateCreateClientBody(parsedBody);
    if (!validation.isValid) {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'createClient', 400, validation.failureMessage);
      return {
        body: validation.failureMessage,
        statusCode: 400,
      };
    }

    const createClientBody: CreateClientBody = parsedBody as CreateClientBody;

    const clientId: string = uuidv4();
    const clientSecretBuffer: Buffer = crypto.randomBytes(32);
    const clientSecretHashed: string = hashClientSecretBuffer(clientSecretBuffer);

    const createRequest: CreateAuthorizationClientRequest = {
      ...createClientBody,
      clientId,
      clientSecretHashed,
      traceId: authorizationRequest.traceId,
    };

    const createResult: CreateAuthorizationClientResult = await getAuthorizationStore().createAuthorizationClient(
      createRequest,
    );

    const { response } = createResult;

    if (response === 'CREATE_SUCCESS') {
      const responseBody: CreateClientResponseBody = {
        client_id: clientId,
        client_secret: clientSecretBuffer.toString('hex'),
        clientName: createRequest.clientName,
        roles: createRequest.roles,
      };

      writeDebugStatusToLog(moduleName, authorizationRequest, 'createClient', 201);
      return {
        body: JSON.stringify(responseBody),
        statusCode: 201,
        headers: { [LOCATION_HEADER_NAME]: `${authorizationRequest.path}/${clientId}` },
      };
    }

    writeDebugStatusToLog(moduleName, authorizationRequest, 'createClient', 500);
    Logger.debug(`${moduleName}.createAuthorization 500`, authorizationRequest.traceId);
    return { body: '', statusCode: 500 };
  } catch (e) {
    writeErrorToLog(moduleName, authorizationRequest.traceId, 'createClient', 500, e);
    return { body: '', statusCode: 500 };
  }
}
