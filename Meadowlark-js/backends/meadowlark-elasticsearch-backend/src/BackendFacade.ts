// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DeleteRequest,
  DeleteResult,
  QueryRequest,
  QueryResult,
  UpdateRequest,
  UpdateResult,
  UpsertRequest,
  UpsertResult,
} from '@edfi/meadowlark-core';
import * as QueryElasticsearch from './repository/QueryElasticsearch';
import * as UpdateElasticsearch from './repository/UpdateElasticsearch';
import { getSharedClient, closeSharedConnection } from './repository/Db';

export async function queryDocuments(request: QueryRequest): Promise<QueryResult> {
  return QueryElasticsearch.queryDocuments(request, await getSharedClient());
}

export async function afterDeleteDocumentById(request: DeleteRequest, result: DeleteResult): Promise<void> {
  return UpdateElasticsearch.afterDeleteDocumentById(request, result, await getSharedClient());
}

export async function afterUpsertDocument(request: UpsertRequest, result: UpsertResult): Promise<void> {
  return UpdateElasticsearch.afterUpsertDocument(request, result, await getSharedClient());
}

export async function afterUpdateDocumentById(request: UpdateRequest, result: UpdateResult): Promise<void> {
  return UpdateElasticsearch.afterUpdateDocumentById(request, result, await getSharedClient());
}

export async function closeConnection(): Promise<void> {
  return closeSharedConnection();
}
