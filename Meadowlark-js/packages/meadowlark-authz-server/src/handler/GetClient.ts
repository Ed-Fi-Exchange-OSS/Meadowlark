// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeDebugStatusToLog, writeErrorToLog, writeRequestToLog } from '../Logger';
import { GetAuthorizationClientRequest } from '../message/GetAuthorizationClientRequest';
import { GetAuthorizationClientResult } from '../message/GetAuthorizationClientResult';
import { ensurePluginsLoaded, getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';
import { validateAdminTokenForAccess } from '../security/TokenValidator';
import { clientIdFrom } from '../Utility';
import { AuthorizationRequest, extractAuthorizationHeader } from './AuthorizationRequest';
import { AuthorizationResponse } from './AuthorizationResponse';

const moduleName = 'authz.handler.GetClient';

export async function getClients(authorizationRequest: AuthorizationRequest): Promise<AuthorizationResponse> {
  try {
    writeRequestToLog(moduleName, authorizationRequest, 'getClients');
    await ensurePluginsLoaded();

    const errorResponse: AuthorizationResponse | undefined = validateAdminTokenForAccess(
      extractAuthorizationHeader(authorizationRequest),
      authorizationRequest.traceId,
    );

    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'getClients', errorResponse.statusCode, errorResponse.body);
      return errorResponse;
    }

    const fetchResult = await getAuthorizationStore().getAllAuthorizationClients(authorizationRequest.traceId);

    if (fetchResult.response === 'GET_SUCCESS') {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'getClients', 200);

      return {
        body: JSON.stringify(fetchResult.clients),
        statusCode: 200,
      };
    }

    if (fetchResult.response === 'GET_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'getClients', 404);
      return { body: '', statusCode: 404 };
    }

    writeDebugStatusToLog(moduleName, authorizationRequest, 'getClients', 500);
    return { body: '', statusCode: 500 };
  } catch (e) {
    writeErrorToLog(moduleName, authorizationRequest.traceId, 'getClients', 500, e);
    return { body: '', statusCode: 500 };
  }
}

export async function getClientById(authorizationRequest: AuthorizationRequest): Promise<AuthorizationResponse> {
  try {
    writeRequestToLog(moduleName, authorizationRequest, 'getClientById');
    await ensurePluginsLoaded();

    const errorResponse: AuthorizationResponse | undefined = validateAdminTokenForAccess(
      extractAuthorizationHeader(authorizationRequest),
      authorizationRequest.traceId,
    );

    if (errorResponse != null) {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'getClientById', errorResponse.statusCode, errorResponse.body);
      return errorResponse;
    }

    const pathExpression = /\/(?<oauth>[^/]+)\/(?<client>[^/]+)\/((?<clientId>[^/]*$))?/gm;
    const clientId: string = clientIdFrom(pathExpression, authorizationRequest.path);
    if (clientId === '') {
      const message = 'Missing client id';
      writeDebugStatusToLog(moduleName, authorizationRequest, 'getClientById', 400, message);
      return { body: JSON.stringify({ message }), statusCode: 400 };
    }

    const getClientRequest: GetAuthorizationClientRequest = {
      clientId,
      traceId: authorizationRequest.traceId,
    };

    const fetchResult: GetAuthorizationClientResult = await getAuthorizationStore().getAuthorizationClient(getClientRequest);

    if (fetchResult.response === 'GET_SUCCESS') {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'getClientById', 200);

      return {
        body: JSON.stringify({
          active: fetchResult.active,
          clientId: getClientRequest.clientId,
          clientName: fetchResult.clientName,
          roles: fetchResult.roles,
        }),
        statusCode: 200,
      };
    }

    if (fetchResult.response === 'GET_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'getClientById', 404);
      return { body: '', statusCode: 404 };
    }

    writeDebugStatusToLog(moduleName, authorizationRequest, 'getClientById', 500);
    return { body: '', statusCode: 500 };
  } catch (e) {
    writeErrorToLog(moduleName, authorizationRequest.traceId, 'getClientById', 500, e);
    return { body: '', statusCode: 500 };
  }
}
