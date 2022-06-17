// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient, QueryResult } from 'pg';
import { GetResult, GetRequest } from '@edfi/meadowlark-core';
import { getDocumentByIdSql } from './QueryHelper';

export async function getDocumentById({ id }: GetRequest, client: PoolClient): Promise<GetResult> {
  try {
    const queryResult: QueryResult = await client.query(await getDocumentByIdSql(id));

    if (queryResult.rowCount === 0) return { response: 'GET_FAILURE_NOT_EXISTS', document: {} };

    const response: GetResult = {
      response: 'GET_SUCCESS',
      document: { id: queryResult.rows[0].document_id, ...queryResult.rows[0].edfi_doc },
    };
    return response;
  } catch (e) {
    return { response: 'UNKNOWN_FAILURE', document: [] };
  }
}
