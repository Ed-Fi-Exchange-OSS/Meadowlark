// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { meadowlarkIdForDocumentIdentity, FrontendRequest, writeRequestToLog, MeadowlarkId } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import type { PoolClient } from 'pg';
import { SecurityResult } from '../security/SecurityResult';
import { findOwnershipForDocumentByDocumentUuid, findOwnershipForDocumentByMeadowlarkId } from './SqlHelper';
import { MeadowlarkDocument, NoMeadowlarkDocument } from '../model/MeadowlarkDocument';

function extractIdIfUpsert(frontendRequest: FrontendRequest): MeadowlarkId | undefined {
  if (frontendRequest.action !== 'upsert') return undefined;

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
  // First we try to use the documentUuid, because it is constant (meadowlarkId could be updated).
  // An update sends the documentUuid. In this case, we cannot use the meadowlarkId because in some case we could
  // change the documentUuid.
  const { documentUuid } = frontendRequest.middleware.pathComponents;
  let meadowlarkId: MeadowlarkId = '' as MeadowlarkId;
  let idLogMessage: String = '';
  // if the request is an insert, the documentUuid is empty. Then, we need the meadowlarkId to validate
  if (documentUuid == null) {
    meadowlarkId = extractIdIfUpsert(frontendRequest) ?? ('' as MeadowlarkId);
    idLogMessage = `MeadowlarkId ${meadowlarkId}`;
  } else {
    idLogMessage = `DocumentUuid ${documentUuid}`;
  }

  if (documentUuid == null && meadowlarkId === '') {
    Logger.error(`${functionName} no MeadowlarkId or DocumentUuid to secure against`, frontendRequest.traceId);
    return 'NOT_APPLICABLE';
  }

  try {
    const meadowlarkDocument: MeadowlarkDocument =
      documentUuid != null
        ? await findOwnershipForDocumentByDocumentUuid(client, documentUuid)
        : await findOwnershipForDocumentByMeadowlarkId(client, meadowlarkId);

    if (meadowlarkDocument == null) {
      Logger.error(`${functionName} Unknown Error determining access`, frontendRequest.traceId);
      return 'UNKNOWN_FAILURE';
    }

    if (meadowlarkDocument === NoMeadowlarkDocument) {
      Logger.debug(`${functionName} document not found for ${idLogMessage}`, frontendRequest.traceId);
      return 'NOT_APPLICABLE';
    }
    const { clientId } = frontendRequest.middleware.security;

    if (meadowlarkDocument.created_by === clientId) {
      Logger.debug(`${functionName} access approved: ${idLogMessage}, clientId ${clientId}`, frontendRequest.traceId);
      return 'ACCESS_APPROVED';
    }
    Logger.debug(`${functionName} access denied: ${idLogMessage}, clientId ${clientId}`, frontendRequest.traceId);
    return 'ACCESS_DENIED';
  } catch (e) {
    Logger.error(`${functionName} Error determining access`, frontendRequest.traceId, e);
    return 'UNKNOWN_FAILURE';
  }
}
