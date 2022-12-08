// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import { QueryRequest, QueryResult } from '@edfi/meadowlark-core';
import { MongoClient } from 'mongodb';

/**
 * The MongoDB backend does not support queries.
 */
export async function queryDocuments({ traceId }: QueryRequest, _client: MongoClient): Promise<QueryResult> {
  Logger.warn('mongodb.repository.Query.queryDocument should never be called', traceId);
  return { response: 'UNKNOWN_FAILURE', documents: [] };
}
