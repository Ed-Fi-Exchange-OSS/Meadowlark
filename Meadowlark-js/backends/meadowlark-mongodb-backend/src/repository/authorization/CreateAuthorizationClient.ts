// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, ClientSession, MongoClient } from 'mongodb';
import { Logger } from '@edfi/meadowlark-core';
import { CreateAuthorizationClientRequest, CreateAuthorizationClientResult } from '@edfi/meadowlark-authz-server';
import { AuthorizationDocument, authorizationDocumentFromCreate } from '../../model/AuthorizationDocument';
import { asUpsert, getAuthorizationCollection } from '../Db';

const functionName = 'mongodb.repository.authorization.CreateCreateAuthorizationClientDocument';

export async function createAuthorizationClientDocument(
  request: CreateAuthorizationClientRequest,
  client: MongoClient,
): Promise<CreateAuthorizationClientResult> {
  let session: ClientSession | null = null;
  const createResult: CreateAuthorizationClientResult = { response: 'UNKNOWN_FAILURE' };

  try {
    const mongoCollection: Collection<AuthorizationDocument> = getAuthorizationCollection(client);
    session = client.startSession();

    await session.withTransaction(async () => {
      if (session == null) return; // makes TypeScript happy

      const authorizationClient: AuthorizationDocument = authorizationDocumentFromCreate(request);

      Logger.debug(`${functionName}: Inserting client id ${request.clientId}`, request.traceId);

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
        Logger.error(functionName, request.traceId, msg);
      }
    });
  } catch (e) {
    Logger.error(functionName, request.traceId, e);
  } finally {
    if (session != null) await session.endSession();
  }
  return createResult;
}
