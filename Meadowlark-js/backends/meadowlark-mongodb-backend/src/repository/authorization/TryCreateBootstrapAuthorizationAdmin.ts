// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, ClientSession, MongoClient } from 'mongodb';
import { Logger } from '@edfi/meadowlark-utilities';
import { CreateAuthorizationClientRequest, TryCreateBootstrapAuthorizationAdminResult } from '@edfi/meadowlark-authz-server';
import { AuthorizationDocument, bootstrapAdminDocumentFromCreate } from '../../model/AuthorizationDocument';
import { asUpsert, getAuthorizationCollection } from '../Db';

const functionName = 'mongodb.repository.authorization.tryCreateBootstrapAuthorizationAdminDocument';

export async function tryCreateBootstrapAuthorizationAdminDocument(
  request: CreateAuthorizationClientRequest,
  client: MongoClient,
): Promise<TryCreateBootstrapAuthorizationAdminResult> {
  let session: ClientSession | null = null;
  const createResult: TryCreateBootstrapAuthorizationAdminResult = { response: 'UNKNOWN_FAILURE' };

  try {
    const mongoCollection: Collection<AuthorizationDocument> = getAuthorizationCollection(client);
    session = client.startSession();

    await session.withTransaction(async () => {
      if (session == null) return; // makes TypeScript happy

      const authorizationClient: AuthorizationDocument = bootstrapAdminDocumentFromCreate(request);

      Logger.debug(`${functionName}: Trying insert of admin client id ${request.clientId}`, request.traceId);

      // Look for isBootstrapAdmin flag in db via upsert attempt. If not there it's an insert, so create it.
      // If already there, do nothing.
      // @ts-ignore - mongodb 4.11.0 typings are wrong when using $setOnInsert
      const { acknowledged, upsertedCount } = await mongoCollection.updateOne(
        { isBootstrapAdmin: true },
        // @ts-ignore - mongodb 4.11.0 typings are wrong when using $setOnInsert
        { $setOnInsert: authorizationClient },
        asUpsert(session),
      );

      if (!acknowledged) {
        const msg =
          'mongoCollection.replaceOne returned acknowledged: false, indicating a problem with write concern configuration';
        Logger.error(functionName, request.traceId, msg);
      } else {
        if (upsertedCount === 1) {
          Logger.debug(`${functionName}: Inserted admin client`, request.traceId);
        } else {
          Logger.info(
            `${functionName}: An attempt was made to create a boostrap Admin ID when one already exists.`,
            request.traceId,
          );
        }
        createResult.response = upsertedCount === 1 ? 'CREATE_SUCCESS' : 'CREATE_FAILURE_ALREADY_EXISTS';
      }
    });
  } catch (e) {
    Logger.error(functionName, request.traceId, e);
  } finally {
    if (session != null) await session.endSession();
  }
  return createResult;
}
