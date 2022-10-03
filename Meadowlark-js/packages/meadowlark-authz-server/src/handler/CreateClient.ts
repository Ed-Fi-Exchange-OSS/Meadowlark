// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { randomBytes } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { authorizationHeader, Logger } from '@edfi/meadowlark-core';
import type { ErrorObject } from 'ajv';
import { CreateClientRequest } from '../message/CreateClientRequest';
import { CreateClientResult } from '../message/CreateClientResult';
import { CreateClientBody, validateCreateClientBody } from '../model/CreateClientBody';
import { getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';
import { checkForAuthorizationErrors } from '../security/JwtValidator';
import { AuthorizationRequest } from './AuthorizationRequest';
import { AuthorizationResponse } from './AuthorizationResponse';

const moduleName = 'handler.credentials.Create';

/**
 * Handler for client creation
 */
export async function createClient(credentialRequest: AuthorizationRequest): Promise<AuthorizationResponse> {
  const errorResponse: AuthorizationResponse | undefined = checkForAuthorizationErrors(
    authorizationHeader(credentialRequest.headers),
  );

  if (errorResponse != null) {
    return errorResponse;
  }

  if (credentialRequest.body == null) {
    return { body: '', statusCode: 400 };
  }

  const isBodyValid: boolean = validateCreateClientBody(credentialRequest.body);
  if (!isBodyValid) {
    return {
      body: (validateCreateClientBody.errors ?? [])
        .map((error: ErrorObject) => `${error.instancePath} ${error.message}` ?? '')
        .join(','),
      statusCode: 400,
    };
  }

  const createClientBody: CreateClientBody = JSON.parse(credentialRequest.body) as CreateClientBody;

  const createClientRequest: CreateClientRequest = {
    ...createClientBody,
    clientId: uuidv4(),
    clientSecret: randomBytes(32).toString('hex'),
    traceId: credentialRequest.traceId,
  };

  const createResult: CreateClientResult = await getAuthorizationStore().createAuthorizationClient(createClientRequest);

  const { response } = createResult;

  if (response === 'UNKNOWN_FAILURE') {
    Logger.debug(`${moduleName}.createAuthorization 500`, credentialRequest.traceId);
    return { body: '', statusCode: 500 };
  }

  Logger.debug(`${moduleName}.createAuthorization 201`, credentialRequest.traceId);
  return {
    body: '',
    statusCode: 201,
  };
}
