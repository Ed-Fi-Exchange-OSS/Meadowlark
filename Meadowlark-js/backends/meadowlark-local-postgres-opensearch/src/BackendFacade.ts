// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DeleteRequest,
  DeleteResult,
  GetRequest,
  GetResult,
  QueryRequest,
  QueryResult,
  UpdateRequest,
  UpdateResult,
  UpsertRequest,
  UpsertResult,
} from '@edfi/meadowlark-core';

// import * as Upsert from './repository/Upsert';
// import * as Delete from './repository/Delete';
// import * as Read from './repository/Read';
import * as Query from './repository/Query';
// import * as Update from './repository/Update';
import { getSharedClient } from './repository/Db';

// @ts-ignore
export async function deleteDocumentById(request: DeleteRequest): Promise<DeleteResult> {
  return { result: 'UNKNOWN_FAILURE', failureMessage: '' };
  // return Delete.deleteDocumentById(request, await getSharedClient());
}

// @ts-ignore
export async function getDocumentById(request: GetRequest): Promise<GetResult> {
  return { result: 'ERROR', documents: [] };
  // return Read.getDocumentById(request, await getSharedClient());
}

// @ts-ignore
export async function upsertDocument(request: UpsertRequest): Promise<UpsertResult> {
  return { result: 'UNKNOWN_FAILURE' };
}

// @ts-ignore
export async function updateDocumentById(request: UpdateRequest): Promise<UpdateResult> {
  return { result: 'UNKNOWN_FAILURE', failureMessage: '' };
  // return Update.updateDocumentById(request, await getSharedClient());
}

export async function queryDocumentList(request: QueryRequest): Promise<QueryResult> {
  return Query.queryDocumentList(request, await getSharedClient());
}

export async function getDocumentList(request: QueryRequest): Promise<GetResult> {
  return Query.getDocumentList(request, await getSharedClient());
}
