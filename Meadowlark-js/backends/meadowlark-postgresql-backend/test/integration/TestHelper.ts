// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { PoolClient } from 'pg';

export async function deleteAll(client: PoolClient): Promise<void> {
  await client.query('TRUNCATE TABLE meadowlark.documents');
  await client.query('TRUNCATE TABLE meadowlark.references');
}
