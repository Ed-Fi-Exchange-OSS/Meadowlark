// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, ClientSession, MongoClient } from 'mongodb';
import { Logger } from '@edfi/meadowlark-core';
import { ResetAuthorizationClientSecretRequest, ResetAuthorizationClientSecretResult } from '@edfi/meadowlark-authz-server';
import { AuthorizationDocument } from '../../model/AuthorizationDocument';
import { getAuthorizationCollection } from '../Db';

const functionName = 'mongodb.repository.authorization.ResetAuthorizationClientDocument';

export async function resetAuthorizationClientSecret(
  request: ResetAuthorizationClientSecretRequest,
  client: MongoClient,
): Promise<ResetAuthorizationClientSecretResult> {
  let session: ClientSession | null = null;
  const resetResult: ResetAuthorizationClientSecretResult = { response: 'UNKNOWN_FAILURE' };

  try {
    const mongoCollection: Collection<AuthorizationDocument> = getAuthorizationCollection(client);
    session = client.startSession();

    await session.withTransaction(async () => {
      if (session == null) return; // makes TypeScript happy

      Logger.debug(`${functionName}: Updating secret for client id ${request.clientId}`, request.traceId);

      const { acknowledged, matchedCount } = await mongoCollection.updateOne(
        { _id: request.clientId },
        { $set: { clientSecretHashed: request.clientSecretHashed } },
        { session },
      );

      if (acknowledged && matchedCount === 0) {
        Logger.debug(`${functionName}: client id ${request.clientId} does not exist`, request.traceId);
        resetResult.response = 'RESET_FAILED_NOT_EXISTS';
      } else if (acknowledged && matchedCount > 0) {
        resetResult.response = 'RESET_SUCCESS';
      } else {
        const msg =
          'mongoCollection.updateOne returned acknowledged: false, indicating a problem with write concern configuration';
        Logger.error(functionName, request.traceId, msg);
      }
    });
  } catch (e) {
    Logger.error(functionName, request.traceId, e);
  } finally {
    if (session != null) await session.endSession();
  }
  return resetResult;
}
