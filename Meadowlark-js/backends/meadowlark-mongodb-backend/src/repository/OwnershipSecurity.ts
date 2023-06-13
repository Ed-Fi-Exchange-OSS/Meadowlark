// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import { meadowlarkIdForDocumentIdentity, FrontendRequest, writeRequestToLog, MeadowlarkId } from '@edfi/meadowlark-core';
import { Collection, MongoClient, WithId } from 'mongodb';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { SecurityResult } from '../security/SecurityResult';
import { getDocumentCollection } from './Db';

function extractMeadowlarkIdIfUpsert(frontendRequest: FrontendRequest): MeadowlarkId | null {
  if (frontendRequest.action !== 'upsert') return null;

  return meadowlarkIdForDocumentIdentity(
    frontendRequest.middleware.resourceInfo,
    frontendRequest.middleware.documentInfo.documentIdentity,
  );
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
  const { documentUuid } = frontendRequest.middleware.pathComponents;

  let result: WithId<MeadowlarkDocument> | null = null;

  try {
    if (documentUuid != null) {
      // security by documentUuid if available
      result = await mongoCollection.findOne({ documentUuid }, { projection: { createdBy: 1, _id: 0 } });

      if (result === null) {
        Logger.debug(`${functionName} - document not found for documentUuid ${documentUuid}`, frontendRequest.traceId);
        return 'NOT_APPLICABLE';
      }
      Logger.debug(`${functionName} - document found for documentUuid ${documentUuid}`, frontendRequest.traceId);
    } else {
      // security by meadowlarkId if it's upsert - document body with no documentUuid
      const meadowlarkId: MeadowlarkId | null = extractMeadowlarkIdIfUpsert(frontendRequest);

      if (meadowlarkId == null) {
        Logger.error(`${functionName} - no documentUuid or meadowlarkId to secure against`, frontendRequest.traceId);
        return 'NOT_APPLICABLE';
      }

      result = await mongoCollection.findOne({ _id: meadowlarkId }, { projection: { createdBy: 1, _id: 0 } });

      if (result === null) {
        Logger.debug(`${functionName} - document not found for meadowlarkId ${meadowlarkId}`, frontendRequest.traceId);
        return 'NOT_APPLICABLE';
      }
      Logger.debug(`${functionName} - document found for meadowlarkId ${meadowlarkId}`, frontendRequest.traceId);
    }

    const { clientId } = frontendRequest.middleware.security;
    if (result.createdBy === clientId) {
      Logger.debug(`${functionName} - access approved for clientId ${clientId}`, frontendRequest.traceId);
      return 'ACCESS_APPROVED';
    }

    Logger.debug(`${functionName} - access denied for clientId ${clientId}`, frontendRequest.traceId);
    return 'ACCESS_DENIED';
  } catch (e) {
    return 'UNKNOWN_FAILURE';
  }
}
