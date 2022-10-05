// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { randomBytes } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { authorizationHeader, LOCATION_HEADER_NAME, Logger } from '@edfi/meadowlark-core';
import type { ErrorObject } from 'ajv';
import { CreateClientRequest } from '../message/CreateClientRequest';
import { CreateClientResult } from '../message/CreateClientResult';
import { CreateClientBody, validateCreateClientBody } from '../model/CreateClientBody';
import { getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';
import { checkForAuthorizationErrors } from '../security/JwtValidator';
import { AuthorizationRequest } from './AuthorizationRequest';
import { AuthorizationResponse } from './AuthorizationResponse';

const moduleName = 'handler.CreateClient';

/**
 * Handler for client creation
 */
export async function createClient(authorizationRequest: AuthorizationRequest): Promise<AuthorizationResponse> {
  const errorResponse: AuthorizationResponse | undefined = checkForAuthorizationErrors(
    authorizationHeader(authorizationRequest.headers),
  );

  if (errorResponse != null) {
    return errorResponse;
  }

  if (authorizationRequest.body == null) {
    const message = 'Missing body';
    return { body: JSON.stringify({ message }), statusCode: 400 };
  }

  let parsedBody: any = {};
  try {
    parsedBody = JSON.parse(authorizationRequest.body);
  } catch (error) {
    const message = 'Malformed body';
    return { body: JSON.stringify({ message }), statusCode: 400 };
  }

  const isBodyValid: boolean = validateCreateClientBody(parsedBody);
  if (!isBodyValid) {
    const { errors } = validateCreateClientBody;
    return {
      body: (errors ?? []).map((error: ErrorObject) => `${error.instancePath} ${error.message}` ?? '').join(','),
      statusCode: 400,
    };
  }

  const createClientBody: CreateClientBody = parsedBody as CreateClientBody;
  const clientId: string = uuidv4();

  const createClientRequest: CreateClientRequest = {
    ...createClientBody,
    clientId,
    clientSecret: randomBytes(32).toString('hex'),
    traceId: authorizationRequest.traceId,
  };

  const createResult: CreateClientResult = await getAuthorizationStore().createAuthorizationClient(createClientRequest);

  const { response } = createResult;

  if (response === 'CREATE_SUCCESS') {
    Logger.debug(`${moduleName}.createAuthorization 201`, authorizationRequest.traceId);
    return { body: '', statusCode: 201, headers: { [LOCATION_HEADER_NAME]: `${authorizationRequest.path}/${clientId}` } };
  }

  Logger.debug(`${moduleName}.createAuthorization 500`, authorizationRequest.traceId);
  return { body: '', statusCode: 500 };
}
