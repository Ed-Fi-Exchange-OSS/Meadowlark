// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import { CreateAuthorizationClientRequest, CreateAuthorizationClientResult } from '@edfi/meadowlark-authz-server';
import { PoolClient } from 'pg';
import { AuthorizationDocument, authorizationDocumentFromCreate } from '../../model/AuthorizationDocument';
import { beginTransaction, rollbackTransaction, commitTransaction, insertOrUpdateAuthorization } from '../SqlHelper';

const functionName = 'postgresql.repository.authorization.createAuthorizationClient';

export async function createAuthorizationClientDocument(
  request: CreateAuthorizationClientRequest,
  client: PoolClient,
): Promise<CreateAuthorizationClientResult> {
  const createResult: CreateAuthorizationClientResult = { response: 'UNKNOWN_FAILURE' };
  try {
    await beginTransaction(client);
    const authorizationClient: AuthorizationDocument = authorizationDocumentFromCreate(request);
    const hasResults = await insertOrUpdateAuthorization(authorizationClient, client);
    if (hasResults) {
      createResult.response = 'CREATE_SUCCESS';
    } else {
      const msg = 'Error inserting or updating the authorization client in the PostgreSQL database.';
      Logger.error(functionName, request.traceId, msg);
      await rollbackTransaction(client);
    }
    await commitTransaction(client);
  } catch (e) {
    if (client) {
      await rollbackTransaction(client);
    }
    Logger.error(functionName, request.traceId, e);
  }

  return createResult;
}
