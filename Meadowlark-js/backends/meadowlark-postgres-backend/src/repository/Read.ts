// // SPDX-License-Identifier: Apache-2.0
// // Licensed to the Ed-Fi Alliance under one or more agreements.
// // The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// // See the LICENSE and NOTICES files in the project root for more information.

import { Client, Result } from 'pg';
import { GetResult, GetRequest } from '@edfi/meadowlark-core';

// @ts-ignore
export async function getDocumentById({ id }: GetRequest, client: Client): Promise<GetResult> {
  const getByIdSQL =
    'SELECT _pk, id, document_identity, project_name, resource_name, resource_version,' +
    ' is_descriptor, validated, edfi_doc' +
    ' FROM meadowlark.documents' +
    ` WHERE id = '${id}';`;

  try {
    const queryResult: Result = await client.query(getByIdSQL);

    if (queryResult.rows.count === 0) return { response: 'GET_FAILURE_NOT_EXISTS', document: [] };
    const response: GetResult = {
      response: 'GET_SUCCESS',
      document: { id: queryResult.rows[0].id, ...queryResult.rows[0].edfi_doc },
    };
    return response;
  } catch (e) {
    return { response: 'UNKNOWN_FAILURE', document: [] };
  } finally {
    client.release();
  }
}
