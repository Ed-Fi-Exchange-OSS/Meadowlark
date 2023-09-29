// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { MeadowlarkId } from '@edfi/meadowlark-core';
import { PoolClient } from 'pg';
import format from 'pg-format';

export async function deleteAllAuthorizations(client: PoolClient): Promise<void> {
  await client.query('TRUNCATE TABLE meadowlark.authorizations');
}

export async function deleteAll(client: PoolClient): Promise<void> {
  await client.query('TRUNCATE TABLE meadowlark.documents');
  await client.query('TRUNCATE TABLE meadowlark.references');
  await client.query('TRUNCATE TABLE meadowlark.aliases');
}

export const verifyAliasMeadowlarkId = (aliasMeadowlarkId: MeadowlarkId): string =>
  format(
    `SELECT alias_meadowlark_id from meadowlark.aliases
  WHERE meadowlark_id = %L AND alias_meadowlark_id != %1$L`,
    [aliasMeadowlarkId],
  );

/**
 * Function that produces a parametrized SQL query for retrieving the references for a given document
 * @param meadowlarkId The identifier of the document
 * @returns SQL query string to retrieve references
 */
export function retrieveReferencesByMeadowlarkIdSql(meadowlarkId: MeadowlarkId): string {
  return format('SELECT referenced_meadowlark_id FROM meadowlark.references WHERE parent_meadowlark_id=%L', [meadowlarkId]);
}
