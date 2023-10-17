// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import retry from 'async-retry';
import { Logger, Config } from '@edfi/meadowlark-utilities';
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
  let retryCount = 0;
  try {
    const numberOfRetries: number = Config.get('POSTGRES_MAX_NUMBER_OF_RETRIES');
    const createProcess = await retry(
      async (bail) => {
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
          return createResult;
        } catch (error) {
          retryCount += 1;
          await rollbackTransaction(client);
          // If there's a serialization failure, rollback the transaction
          if (error.code === '40001') {
            if (retryCount >= numberOfRetries) {
              throw Error('Error after maximum retries');
            }
            // Throws the error to be handled by async-retry
            throw error;
          } else {
            // If it's not a serialization failure, don't retry and rethrow the error
            Logger.error(`${functionName}.createAuthorizationClientDocument`, request.traceId, error);
            // Throws the error to be handled by the caller
            bail(error);
          }
        }
        return createResult;
      },
      {
        retries: numberOfRetries,
        onRetry: (error, attempt) => {
          if (attempt === numberOfRetries) {
            Logger.error('Error after maximum retries', error);
          } else {
            Logger.error('Retrying transaction due to error:', error);
          }
        },
      },
    );
    return createProcess;
  } catch (e) {
    Logger.error(functionName, request.traceId, e);
  }
  return createResult;
}
