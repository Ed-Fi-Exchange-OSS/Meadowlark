// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, ClientSession, MongoClient } from 'mongodb';
import { Logger } from '@edfi/meadowlark-utilities';
import { UpdateAuthorizationClientRequest, UpdateAuthorizationClientResult } from '@edfi/meadowlark-authz-server';
import { AuthorizationDocument } from '../../model/AuthorizationDocument';
import { getAuthorizationCollection } from '../Db';

const functionName = 'mongodb.repository.authorization.UpdateAuthorizationClientDocument';

export async function updateAuthorizationClientDocument(
  request: UpdateAuthorizationClientRequest,
  client: MongoClient,
): Promise<UpdateAuthorizationClientResult> {
  let session: ClientSession | null = null;
  const updateResult: UpdateAuthorizationClientResult = { response: 'UNKNOWN_FAILURE' };

  try {
    const mongoCollection: Collection<AuthorizationDocument> = getAuthorizationCollection(client);
    session = client.startSession();

    await session.withTransaction(async () => {
      if (session == null) return; // makes TypeScript happy

      Logger.debug(`${functionName}: Updating client id ${request.clientId}`, request.traceId);

      const { acknowledged, matchedCount } = await mongoCollection.updateOne(
        { _id: request.clientId },
        { $set: { clientName: request.clientName, roles: request.roles } },
        { session },
      );

      if (acknowledged && matchedCount === 0) {
        Logger.debug(`${functionName}: client id ${request.clientId} does not exist`, request.traceId);
        updateResult.response = 'UPDATE_FAILED_NOT_EXISTS';
      } else if (acknowledged && matchedCount > 0) {
        updateResult.response = 'UPDATE_SUCCESS';
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
  return updateResult;
}
