// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, MongoClient, WithId } from 'mongodb';
import { Logger } from '@edfi/meadowlark-utilities';
import { GetAllAuthorizationClientsResult } from '@edfi/meadowlark-authz-server';
import { AuthorizationDocument } from '../../model/AuthorizationDocument';
import { getAuthorizationCollection } from '../Db';

export async function getAllAuthorizationClientDocuments(
  traceId: string,
  client: MongoClient,
): Promise<GetAllAuthorizationClientsResult> {
  const mongoCollection: Collection<AuthorizationDocument> = getAuthorizationCollection(client);

  try {
    const result: WithId<AuthorizationDocument>[] = await mongoCollection.find().toArray();
    if (result === null) return { response: 'GET_FAILURE_NOT_EXISTS' };

    return {
      response: 'GET_SUCCESS',
      clients: result,
    };
  } catch (e) {
    Logger.error('GetAuthorizationClient.getAuthorizationClientDocument', traceId, e);
    return { response: 'UNKNOWN_FAILURE' };
  }
}
