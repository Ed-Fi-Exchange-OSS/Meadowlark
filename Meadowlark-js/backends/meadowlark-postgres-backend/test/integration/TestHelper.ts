// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import postgres from 'postgres';

/**
 * Deletes all data from the document and references table
 * @param client PostgreSQL client to perform queries
 */
export async function deleteAll(client: postgres.Sql<any>): Promise<void> {
  try {
    // eslint-disable-next-line no-shadow
    await client.begin(async (client) => {
      client`DELETE FROM meadowlark.documents;`;
      client`DELETE FROM meadowlark.references;`;
    });
  } catch (e) {
    throw e;
  } finally {
    client.end();
  }
}
