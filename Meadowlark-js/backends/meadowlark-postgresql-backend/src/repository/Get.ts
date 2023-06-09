// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient, QueryResult } from 'pg';
import { GetResult, GetRequest } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { findDocumentByDocumentUuidSql } from './SqlHelper';

const moduleName = 'postgresql.repository.Get';

export async function getDocumentByDocumentUuid(
  { documentUuid, traceId }: GetRequest,
  client: PoolClient,
): Promise<GetResult> {
  try {
    Logger.debug(`${moduleName}.getDocumentByDocumentUuid ${documentUuid}`, traceId);
    const queryResult: QueryResult = await client.query(findDocumentByDocumentUuidSql(documentUuid));

    // Postgres will return an empty row set if no results are returned, if we have no rows, there is a problem
    if (queryResult.rows == null) {
      const errorMessage = `Could not retrieve DocumentUuid ${documentUuid}
      a null result set was returned, indicating system failure`;
      Logger.error(errorMessage, traceId);
      return {
        response: 'UNKNOWN_FAILURE',
        document: {},
        failureMessage: errorMessage,
      };
    }

    if (queryResult.rowCount === 0) return { response: 'GET_FAILURE_NOT_EXISTS', document: {} };

    const response: GetResult = {
      response: 'GET_SUCCESS',
      document: { id: queryResult.rows[0].meadowlark_id, ...queryResult.rows[0].edfi_doc },
    };
    return response;
  } catch (e) {
    Logger.error(`${moduleName}.getDocumentByDocumentUuid Error retrieving DocumentUuid ${documentUuid}`, traceId, e);
    return { response: 'UNKNOWN_FAILURE', document: [] };
  }
}
