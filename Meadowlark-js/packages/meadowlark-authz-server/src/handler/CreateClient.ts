// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import crypto from 'node:crypto';
import { LOCATION_HEADER_NAME, Logger } from '@edfi/meadowlark-utilities';
import { CreateAuthorizationClientRequest } from '../message/CreateAuthorizationClientRequest';
import { CreateAuthorizationClientResult } from '../message/CreateAuthorizationClientResult';
import { CreateClientBody } from '../model/ClientBody';
import { ensurePluginsLoaded, getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';
import { validateAdminTokenForAccess } from '../security/TokenValidator';
import { AuthorizationRequest, extractAuthorizationHeader } from './AuthorizationRequest';
import { AuthorizationResponse } from './AuthorizationResponse';
import { CreateClientResponseBody } from '../model/CreateClientResponseBody';
import { writeDebugObject, writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
import { BodyValidation, validateCreateClientBody } from '../validation/BodyValidation';
import { hashClientSecretBuffer } from '../security/HashClientSecret';
import { TryCreateBootstrapAuthorizationAdminResult } from '../message/TryCreateBootstrapAuthorizationAdminResult';
import { ClientId } from '../Utility';

const moduleName = 'authz.handler.CreateClient';

async function tryCreateBootstrapAdmin(
  request: CreateAuthorizationClientRequest,
  clientSecretAsHex: string,
  httpRequestPath: string,
): Promise<AuthorizationResponse> {
  try {
    // Must be a create request for admin role only
    if (request.roles.length !== 1 || request.roles[0] !== 'admin') {
      Logger.debug(`${moduleName}.tryCreateBootstrapAdmin 401 not requesting admin only`, request.traceId);
      return {
        statusCode: 401,
        body: { error: 'invalid_client', error_description: 'Authorization token not provided' },
      };
    }

    const tryCreateResult: TryCreateBootstrapAuthorizationAdminResult =
      await getAuthorizationStore().tryCreateBootstrapAuthorizationAdmin(request);

    const { response } = tryCreateResult;

    if (response === 'CREATE_FAILURE_ALREADY_EXISTS') {
      Logger.debug(`${moduleName}.tryCreateBootstrapAdmin 401 already exists`, request.traceId);
      return {
        statusCode: 401,
        body: { error: 'invalid_client', error_description: 'Authorization token not provided' },
      };
    }

    if (response === 'CREATE_SUCCESS') {
      const body: CreateClientResponseBody = {
        client_id: request.clientId,
        client_secret: clientSecretAsHex,
        clientName: request.clientName,
        roles: request.roles,
      };

      Logger.debug(`${moduleName}.tryCreateBootstrapAdmin 201`, request.traceId);
      return {
        body,
        statusCode: 201,
        headers: { [LOCATION_HEADER_NAME]: `${httpRequestPath}/${request.clientId}` },
      };
    }

    Logger.debug(`${moduleName}.tryCreateBootstrapAdmin 500`, request.traceId);
    return { statusCode: 500 };
  } catch (e) {
    writeErrorToLog(moduleName, request.traceId, 'tryCreateBootstrapAdmin', 500, e);
    return { statusCode: 500 };
  }
}

/**
 * Handler for client creation
 */
export async function createClient(authorizationRequest: AuthorizationRequest): Promise<AuthorizationResponse> {
  try {
    writeRequestToLog(moduleName, authorizationRequest, 'createClient');
    await ensurePluginsLoaded();

    const authorizationHeader = extractAuthorizationHeader(authorizationRequest);

    let tokenValidationErrorResponse: AuthorizationResponse | undefined;
    let bootstrapAdminRequest: boolean = false;

    // If no authorization header for creating an admin client, this might be an attempt to create a bootstrap admin
    if (authorizationHeader == null || authorizationHeader === '') {
      Logger.debug(`${moduleName}.createClient No authorization header`, authorizationRequest.traceId);
      bootstrapAdminRequest = true;
    } else {
      tokenValidationErrorResponse = validateAdminTokenForAccess(authorizationHeader, authorizationRequest.traceId);
    }

    if (tokenValidationErrorResponse != null) {
      writeDebugObject(
        moduleName,
        authorizationRequest,
        'createClient',
        tokenValidationErrorResponse.statusCode,
        tokenValidationErrorResponse.body,
      );
      return tokenValidationErrorResponse;
    }

    if (authorizationRequest.body == null) {
      const error = 'Missing body';
      writeDebugStatusToLog(moduleName, authorizationRequest, 'createClient', 400, error);
      return { body: { error }, statusCode: 400 };
    }

    let parsedBody: any = {};
    try {
      parsedBody = JSON.parse(authorizationRequest.body);
    } catch (exception) {
      const error = `Malformed body: ${exception.message}`;
      writeDebugStatusToLog(moduleName, authorizationRequest, 'createClient', 400, error);
      return { body: { error }, statusCode: 400 };
    }

    const validation: BodyValidation = validateCreateClientBody(parsedBody);
    if (!validation.isValid) {
      writeDebugObject(moduleName, authorizationRequest, 'createClient', 400, validation.failureMessage);
      return {
        body: { error: validation.failureMessage },
        statusCode: 400,
      };
    }

    const createClientBody: CreateClientBody = parsedBody as CreateClientBody;

    const clientId = ClientId.new();

    const clientSecretBuffer: Buffer = crypto.randomBytes(32);
    const clientSecretHashed: string = hashClientSecretBuffer(clientSecretBuffer);

    const createRequest: CreateAuthorizationClientRequest = {
      ...createClientBody,
      clientId,
      clientSecretHashed,
      traceId: authorizationRequest.traceId,
      active: createClientBody.active ?? true,
    };

    if (bootstrapAdminRequest) {
      Logger.info(`${moduleName}.createClient create bootstrap admin`, authorizationRequest.traceId);
      return tryCreateBootstrapAdmin(createRequest, clientSecretBuffer.toString('hex'), authorizationRequest.path);
    }

    const createResult: CreateAuthorizationClientResult =
      await getAuthorizationStore().createAuthorizationClient(createRequest);

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
        body: responseBody,
        statusCode: 201,
        headers: { [LOCATION_HEADER_NAME]: `${authorizationRequest.path}/${clientId}` },
      };
    }

    writeDebugStatusToLog(moduleName, authorizationRequest, 'createClient', 500);
    Logger.error(`${moduleName}.createAuthorization 500`, authorizationRequest.traceId, 'unknown error');
    return { statusCode: 500 };
  } catch (e) {
    writeErrorToLog(moduleName, authorizationRequest.traceId, 'createClient', 500, e);
    return { statusCode: 500 };
  }
}
