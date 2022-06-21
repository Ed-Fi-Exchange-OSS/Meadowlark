// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient } from 'pg';

/**
 * Deletes all data from the document and references table
 * @param client PostgreSQL client to perform queries
 */
export async function deleteAll(client: PoolClient): Promise<void> {
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM meadowlark.documents;');
    await client.query('DELETE FROM meadowlark.references;');
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
