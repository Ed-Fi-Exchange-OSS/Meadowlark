// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { GetResult, QueryRequest, QueryResult } from '@edfi/meadowlark-core';
import { Client } from 'pg';

export async function queryDocumentList(_request: QueryRequest, _client: Client): Promise<QueryResult> {
  return { success: false, results: [] };
}

export async function getDocumentList(_request: QueryRequest, _client: Client): Promise<GetResult> {
  return { result: 'ERROR', documents: [] };
}
