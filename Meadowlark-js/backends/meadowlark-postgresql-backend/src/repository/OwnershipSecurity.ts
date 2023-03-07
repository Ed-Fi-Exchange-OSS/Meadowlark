// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  meadowlarkIdForDocumentIdentity,
  FrontendRequest,
  writeRequestToLog,
  MeadowlarkId,
  DocumentUuid,
} from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import type { PoolClient, QueryResult } from 'pg';
import { SecurityResult } from '../security/SecurityResult';
import { findOwnershipForDocumentSql } from './SqlHelper';

function extractIdIfUpsert(frontendRequest: FrontendRequest): MeadowlarkId | null {
  if (frontendRequest.action !== 'upsert') return null;

  return meadowlarkIdForDocumentIdentity(
    frontendRequest.middleware.resourceInfo,
    frontendRequest.middleware.documentInfo.documentIdentity,
  );
}

export async function rejectByOwnershipSecurity(
  frontendRequest: FrontendRequest,
  client: PoolClient,
): Promise<SecurityResult> {
  const moduleName = 'postgresql.repository.OwnershipSecurity';
  const functionName = `${moduleName}.rejectByOwnershipSecurity`;

  writeRequestToLog(moduleName, frontendRequest, 'rejectByOwnershipSecurity');

  // If it's a GET request and a descriptor, ignore ownership
  if (
    frontendRequest.middleware.resourceInfo.isDescriptor &&
    (frontendRequest.action === 'getById' || frontendRequest.action === 'query')
  ) {
    Logger.debug(`${functionName} GET style request for a descriptor, bypassing ownership check`, frontendRequest.traceId);
    return 'NOT_APPLICABLE';
  }

  let id: DocumentUuid | undefined = frontendRequest.middleware.pathComponents.documentUuid;

  // TODO *** cast to unknown is an invalid mixing of meadowlarkId and documentUuid
  if (id == null) id = extractIdIfUpsert(frontendRequest) as unknown as DocumentUuid;

  if (id == null) {
    Logger.error(`${functionName} no id to secure against`, frontendRequest.traceId);
    return 'NOT_APPLICABLE';
  }

  try {
    const result: QueryResult = await client.query(findOwnershipForDocumentSql(id));

    if (result.rows == null) {
      Logger.error(`${functionName} Unknown Error determining access`, frontendRequest.traceId);
      return 'UNKNOWN_FAILURE';
    }

    if (result.rowCount === 0) {
      Logger.debug(`${functionName} document not found for id ${id}`, frontendRequest.traceId);
      return 'NOT_APPLICABLE';
    }
    const { clientId } = frontendRequest.middleware.security;

    if (result.rows[0].created_by === clientId) {
      Logger.debug(`${functionName} access approved: id ${id}, clientId ${clientId}`, frontendRequest.traceId);
      return 'ACCESS_APPROVED';
    }
    Logger.debug(`${functionName} access denied: id ${id}, clientId ${clientId}`, frontendRequest.traceId);
    return 'ACCESS_DENIED';
  } catch (e) {
    Logger.error(`${functionName} Error determining access`, frontendRequest.traceId, e);
    return 'UNKNOWN_FAILURE';
  }
}
