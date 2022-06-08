// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { documentIdForDocumentInfo, FrontendRequest, Logger } from '@edfi/meadowlark-core';
import { Client } from 'pg';
import format from 'pg-format';
import { SecurityResult } from '../security/SecurityResponse';

function extractIdFromUpsert(frontendRequest: FrontendRequest): string | null {
  if (frontendRequest.action !== 'upsert') return null;

  return documentIdForDocumentInfo(frontendRequest.middleware.resourceInfo, frontendRequest.middleware.documentInfo);
}

export async function rejectByOwnershipSecurity(frontendRequest: FrontendRequest, client: Client): Promise<SecurityResult> {
  const functionName = 'OwnershipSecurity.rejectByOwnershipSecurity';
  Logger.info(functionName, frontendRequest.traceId, frontendRequest);

  // const mongoCollection: Collection<MeadowlarkDocument> = getCollection(client);
  let id = frontendRequest.middleware.pathComponents.resourceId;

  if (id == null) id = extractIdFromUpsert(frontendRequest);

  if (id == null) {
    Logger.error(`${functionName} - no id to secure against`, frontendRequest.traceId);
    return 'NOT_APPLICABLE';
  }

  try {
    // TODO@SAA - Not Complete
    const result = await client.query(format('SELECT * FROM meadowlark.documents WHERE id=%L', [id]));
    // const result: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
    //   { id },
    //   { projection: { createdBy: 1, _id: 0 } },
    // );
    if (result.rowCount === null) {
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
