// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, Logger } from '@edfi/meadowlark-core';
import { Collection, MongoClient, WithId } from 'mongodb';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { SecurityResult } from '../security/SecurityResponse';
import { getCollection } from './Db';

export async function rejectByOwnershipSecurity(
  frontendRequest: FrontendRequest,
  client: MongoClient,
): Promise<SecurityResult> {
  const functionName = 'OwnershipSecurity.rejectByOwnershipSecurity';
  Logger.info(functionName, frontendRequest.traceId, frontendRequest);

  const mongoCollection: Collection<MeadowlarkDocument> = getCollection(client);
  const id = frontendRequest.middleware.pathComponents.resourceId;
  if (id == null) {
    Logger.debug(`${functionName} - no id to secure against`, frontendRequest.traceId, frontendRequest);
    return 'NOT_APPLICABLE';
  }

  try {
    const result: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
      { id },
      { projection: { createdBy: 1, _id: 0 } },
    );
    if (result === null) {
      Logger.debug(`${functionName} - document not found for id ${id}`, frontendRequest.traceId);
      return 'NOT_APPLICABLE';
    }
    const { clientName } = frontendRequest.middleware.security;
    if (result.createdBy === clientName) {
      Logger.debug(`${functionName} - access approved: id ${id}, clientName ${clientName}`, frontendRequest.traceId);
      return 'ACCESS_APPROVED';
    }
    Logger.debug(`${functionName} - access denied: id ${id}, clientName ${clientName}`, frontendRequest.traceId);
    return 'ACCESS_DENIED';
  } catch (e) {
    return 'UNKNOWN_FAILURE';
  }
}
