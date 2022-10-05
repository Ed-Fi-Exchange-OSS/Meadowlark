// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, ClientSession, MongoClient } from 'mongodb';
import { Logger } from '@edfi/meadowlark-core';
import { CreateClientRequest, CreateClientResult } from '@edfi/meadowlark-authz-server';
import { AuthorizationClient, authorizationClientFrom } from '../../model/AuthorizationClient';
import { asUpsert, getAuthorizationCollection } from '../Db';

export async function createAuthorizationClient(
  request: CreateClientRequest,
  client: MongoClient,
): Promise<CreateClientResult> {
  let session: ClientSession | null = null;
  const createResult: CreateClientResult = { response: 'UNKNOWN_FAILURE' };

  try {
    const mongoCollection: Collection<AuthorizationClient> = getAuthorizationCollection(client);
    session = client.startSession();

    await session.withTransaction(async () => {
      if (session == null) return; // makes TypeScript happy

      const authorizationClient: AuthorizationClient = authorizationClientFrom(request);

      Logger.debug(
        `mongodb.repository.authorization.CreateClient: Upserting client id ${request.clientId}`,
        request.traceId,
      );

      const { acknowledged } = await mongoCollection.replaceOne(
        { _id: request.clientId },
        authorizationClient,
        asUpsert(session),
      );

      if (acknowledged) {
        createResult.response = 'CREATE_SUCCESS';
      } else {
        const msg =
          'mongoCollection.replaceOne returned acknowledged: false, indicating a problem with write concern configuration';
        Logger.error('mongodb.repository.authorization.CreateClient', request.traceId, msg);
      }
    });
  } catch (e) {
    Logger.error('mongodb.repository.authorization.CreateClient', request.traceId, e);
  } finally {
    if (session != null) await session.endSession();
  }
  return createResult;
}
