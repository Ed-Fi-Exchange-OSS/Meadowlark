// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DeleteResult,
  DocumentInfo,
  GetResult,
  PaginationParameters,
  SearchResult,
  Security,
  UpdateResult,
  UpsertResult,
} from '@edfi/meadowlark-core';
import * as Upsert from './repository/Upsert';
import * as Delete from './repository/Delete';
import * as Read from './repository/Read';
import * as Query from './repository/Query';
import * as Update from './repository/Update';
import { getSharedClient } from './repository/Db';

export async function deleteDocumentById(
  id: string,
  documentInfo: DocumentInfo,
  validate: boolean,
  security: Security,
  traceId: string,
): Promise<DeleteResult> {
  return Delete.deleteDocumentById(id, documentInfo, validate, security, traceId, await getSharedClient());
}

export async function getDocumentById(
  documentInfo: DocumentInfo,
  id: string,
  security: Security,
  traceId: string,
): Promise<GetResult> {
  return Read.getDocumentById(documentInfo, id, security, traceId, await getSharedClient());
}

export async function upsertDocument(
  id: string,
  documentInfo: DocumentInfo,
  edfiDoc: object,
  validate: boolean,
  security: Security,
  traceId: string,
): Promise<UpsertResult> {
  return Upsert.upsertDocument(id, documentInfo, edfiDoc, validate, security, traceId, await getSharedClient());
}

export async function updateDocumentById(
  id: string,
  documentInfo: DocumentInfo,
  edfiDoc: object,
  validate: boolean,
  security: Security,
  traceId: string,
): Promise<UpdateResult> {
  return Update.updateDocumentById(id, documentInfo, edfiDoc, validate, security, traceId, await getSharedClient());
}

export async function queryDocumentList(
  documentInfo: DocumentInfo,
  queryStringParameters: object,
  paginationParameters: PaginationParameters,
  traceId: string,
): Promise<SearchResult> {
  return Query.queryDocumentList(
    documentInfo,
    queryStringParameters,
    paginationParameters,
    traceId,
    await getSharedClient(),
  );
}

export async function getDocumentList(documentInfo: DocumentInfo, traceId: string): Promise<GetResult> {
  return Query.getDocumentList(documentInfo, traceId, await getSharedClient());
}
