// // SPDX-License-Identifier: Apache-2.0
// // Licensed to the Ed-Fi Alliance under one or more agreements.
// // The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// // See the LICENSE and NOTICES files in the project root for more information.

import { Client, Result } from 'pg';
import { GetResult, GetRequest, DocumentIdentity } from '@edfi/meadowlark-core';

// @ts-ignore
export async function getDocumentById({ id }: GetRequest, client: Client): Promise<GetResult> {
  const getByIdSQL =
    'SELECT _pk, id, document_identity, project_name, resource_name, resource_version,' +
    ' is_descriptor, validated, edfi_doc' +
    ' FROM meadowlark.documents' +
    ` WHERE id = '${id}';`;

  try {
    const queryResult: Result = await client.query(getByIdSQL);

    if (queryResult.rowCount === 0) return { response: 'GET_FAILURE_NOT_EXISTS', document: [] };
    const test = queryResult.rows[0].document_identity;
    const docObj: DocumentIdentity[] = test;
    const response: GetResult = {
      response: 'GET_SUCCESS',
      document: {
        id: queryResult.rows[0].id,
        documentIdentity: docObj,
        projectName: queryResult.rows[0].project_name,
        resourceName: queryResult.rows[0].resource_name,
        resourceVersion: queryResult.rows[0].resource_version,
        validated: queryResult.rows[0].validated,
        isDescriptor: queryResult.rows[0].is_descriptor,
        edfiDoc: queryResult.rows[0].edfi_doc,
      },
    };
    return response;
  } catch (e) {
    return { response: 'UNKNOWN_FAILURE', document: [] };
  } finally {
    // Planning on letting the caller release the client
    // client.release();
  }
}
