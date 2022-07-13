// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { PoolClient } from 'pg';
import format from 'pg-format';

export async function deleteAll(client: PoolClient): Promise<void> {
  await client.query('TRUNCATE TABLE meadowlark.documents');
  await client.query('TRUNCATE TABLE meadowlark.references');
  await client.query('TRUNCATE TABLE meadowlark.existence');
}

export const verifyExistenceId = (existenceId: string): string =>
  format(
    `SELECT existence_id from meadowlark.existence
  WHERE document_id = %L AND existence_id != %1$L`,
    [existenceId],
  );

/**
 * Function that produces a parametrized SQL query for retrieving the references for a given document
 * @param documentId The identifier of the document
 * @returns SQL query string to retrieve references
 */
export function retrieveReferencesByDocumentIdSql(documentId: string): string {
  return format('SELECT referenced_document_id FROM meadowlark.references WHERE parent_document_id=%L', [documentId]);
}
