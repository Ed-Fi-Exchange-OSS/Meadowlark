// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import { documentIdForDocumentInfo, FrontendRequest, writeRequestToLog } from '@edfi/meadowlark-core';
import { Collection, MongoClient, WithId } from 'mongodb';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { SecurityResult } from '../security/SecurityResult';
import { getDocumentCollection } from './Db';

function extractIdIfUpsert(frontendRequest: FrontendRequest): string | undefined {
  if (frontendRequest.action !== 'upsert') return undefined;

  return documentIdForDocumentInfo(frontendRequest.middleware.resourceInfo, frontendRequest.middleware.documentInfo);
}

export async function rejectByOwnershipSecurity(
  frontendRequest: FrontendRequest,
  client: MongoClient,
): Promise<SecurityResult> {
  const moduleName = 'mongodb.repository.OwnershipSecurity';
  const functionName = `${moduleName}.rejectByOwnershipSecurity`;

  writeRequestToLog(moduleName, frontendRequest, 'rejectByOwnershipSecurity');

  // If it's a GET request and a descriptor, ignore ownership
  if (
    frontendRequest.middleware.resourceInfo.isDescriptor &&
    (frontendRequest.action === 'getById' || frontendRequest.action === 'query')
  ) {
    Logger.debug(`GET style request for a descriptor, bypassing ownership check`, frontendRequest.traceId);
    return 'NOT_APPLICABLE';
  }

  const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);
  let id = frontendRequest.middleware.pathComponents.documentUuid;

  if (id == null) id = extractIdIfUpsert(frontendRequest);

  if (id == null) {
    Logger.error(`${functionName} - no id to secure against`, frontendRequest.traceId);
    return 'NOT_APPLICABLE';
  }

  try {
    const result: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
      { _id: id },
      { projection: { createdBy: 1, _id: 0 } },
    );
    if (result === null) {
      Logger.debug(`${functionName} - document not found for id ${id}`, frontendRequest.traceId);
      return 'NOT_APPLICABLE';
    }
    const { clientId } = frontendRequest.middleware.security;
    if (result.createdBy === clientId) {
      Logger.debug(`${functionName} - access approved: id ${id}, clientId ${clientId}`, frontendRequest.traceId);
      return 'ACCESS_APPROVED';
    }
    Logger.debug(`${functionName} - access denied: id ${id}, clientId ${clientId}`, frontendRequest.traceId);
    return 'ACCESS_DENIED';
  } catch (e) {
    return 'UNKNOWN_FAILURE';
  }
}
