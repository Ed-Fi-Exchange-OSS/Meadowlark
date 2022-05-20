// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { QueryRequest, QueryResult } from '@edfi/meadowlark-core';
import { MongoClient } from 'mongodb';

export async function queryDocuments(_request: QueryRequest, _client: MongoClient): Promise<QueryResult> {
  return { response: 'UNKNOWN_FAILURE', documents: [] };
}
