// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient } from 'pg';
import { GetResult, GetRequest } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { findDocumentByDocumentUuidSql } from './SqlHelper';
import { MeadowlarkDocument, isMeadowlarkDocumentEmpty } from '../model/MeadowlarkDocument';

const moduleName = 'postgresql.repository.Get';

export async function getDocumentByDocumentUuid(
  { documentUuid, traceId }: GetRequest,
  client: PoolClient,
): Promise<GetResult> {
  try {
    Logger.debug(`${moduleName}.getDocumentByDocumentUuid ${documentUuid}`, traceId);
    const meadowlarkDocument: MeadowlarkDocument = await findDocumentByDocumentUuidSql(client, documentUuid);

    // Postgres will return an empty row set if no results are returned, if we have no rows, there is a problem
    if (meadowlarkDocument == null) {
      const errorMessage = `Could not retrieve DocumentUuid ${documentUuid}
      a null result set was returned, indicating system failure`;
      Logger.error(errorMessage, traceId);
      return {
        response: 'UNKNOWN_FAILURE',
        document: {},
        failureMessage: errorMessage,
      };
    }

    if (isMeadowlarkDocumentEmpty(meadowlarkDocument)) return { response: 'GET_FAILURE_NOT_EXISTS', document: {} };

    const response: GetResult = {
      response: 'GET_SUCCESS',
      document: { id: meadowlarkDocument.meadowlark_id, ...meadowlarkDocument.edfi_doc },
    };
    return response;
  } catch (e) {
    Logger.error(`${moduleName}.getDocumentByDocumentUuid Error retrieving DocumentUuid ${documentUuid}`, traceId, e);
    return { response: 'UNKNOWN_FAILURE', document: [] };
  }
}
