// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-utilities';
import { UpdateAuthorizationClientRequest, UpdateAuthorizationClientResult } from '@edfi/meadowlark-authz-server';
import { updateAuthorizationClientDocumentByClientId } from '../SqlHelper';

const functionName = 'postgresql.repository.authorization.updateAuthorizationClientDocument';

export async function updateAuthorizationClientDocument(
  request: UpdateAuthorizationClientRequest,
  client: PoolClient,
): Promise<UpdateAuthorizationClientResult> {
  const updateResult: UpdateAuthorizationClientResult = { response: 'UNKNOWN_FAILURE' };

  try {
    Logger.debug(`${functionName}: Updating client id ${request.clientId}`, request.traceId);
    const updateAuthorizationClientDocumentByClientIdResult: boolean = await updateAuthorizationClientDocumentByClientId(
      request,
      client,
    );
    if (updateAuthorizationClientDocumentByClientIdResult === false) {
      Logger.debug(`${functionName}: client id ${request.clientId} does not exist`, request.traceId);
      updateResult.response = 'UPDATE_FAILED_NOT_EXISTS';
    } else {
      updateResult.response = 'UPDATE_SUCCESS';
    }
  } catch (e) {
    Logger.error(functionName, request.traceId, e);
  }

  return updateResult;
}
