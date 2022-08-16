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
import * as QueryOpensearch from './repository/QueryOpensearch';
import * as UpdateOpensearch from './repository/UpdateOpensearch';
import { getSharedClient } from './repository/Db';

export async function queryDocuments(request: QueryRequest): Promise<QueryResult> {
  return QueryOpensearch.queryDocuments(request, await getSharedClient());
}

export async function afterDeleteDocumentById(request: DeleteRequest, result: DeleteResult): Promise<void> {
  return UpdateOpensearch.afterDeleteDocumentById(request, result, await getSharedClient());
}

export async function afterUpsertDocument(request: UpsertRequest, result: UpsertResult): Promise<void> {
  return UpdateOpensearch.afterUpsertDocument(request, result, await getSharedClient());
}

export async function afterUpdateDocumentById(request: UpdateRequest, result: UpdateResult): Promise<void> {
  return UpdateOpensearch.afterUpdateDocumentById(request, result, await getSharedClient());
}
