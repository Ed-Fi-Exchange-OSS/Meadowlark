// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import type { DeleteRequest } from '../../message/DeleteRequest';
import type { DeleteResult } from '../../message/DeleteResult';
import type { GetRequest } from '../../message/GetRequest';
import type { GetResult } from '../../message/GetResult';
import type { QueryRequest } from '../../message/QueryRequest';
import type { QueryResult } from '../../message/QueryResult';
import type { UpdateRequest } from '../../message/UpdateRequest';
import type { UpdateResult } from '../../message/UpdateResult';
import type { UpsertRequest } from '../../message/UpsertRequest';
import type { UpsertResult } from '../../message/UpsertResult';

import {
  emitter,
  BEFORE_UPSERT_DOCUMENT,
  AFTER_UPSERT_DOCUMENT,
  BEFORE_GET_DOCUMENT_BY_ID,
  AFTER_GET_DOCUMENT_BY_ID,
  BEFORE_UPDATE_DOCUMENT_BY_ID,
  AFTER_UPDATE_DOCUMENT_BY_ID,
  BEFORE_DELETE_DOCUMENT_BY_ID,
  AFTER_DELETE_DOCUMENT_BY_ID,
  BEFORE_QUERY_DOCUMENTS,
  AFTER_QUERY_DOCUMENTS,
} from './Publish';

export type AfterUpsert = [request: UpsertRequest, result: UpsertResult];
export type AfterGet = [request: GetRequest, result: GetResult];
export type AfterUpdate = [request: UpdateRequest, result: UpdateResult];
export type AfterDelete = [request: DeleteRequest, result: DeleteResult];
export type AfterQuery = [request: QueryRequest, result: QueryResult];

export const Subscribe = {
  beforeUpsertDocument: (hook: (request: UpsertRequest) => void) => {
    emitter.on(BEFORE_UPSERT_DOCUMENT, (request: UpsertRequest) => {
      hook(request);
    });
  },

  afterUpsertDocument: (hook: (request: UpsertRequest, result: UpsertResult) => void) => {
    emitter.on(AFTER_UPSERT_DOCUMENT, ([request, result]: AfterUpsert) => {
      hook(request, result);
    });
  },

  beforeGetDocumentById: (hook: (rrequest: GetRequest) => void) => {
    emitter.on(BEFORE_GET_DOCUMENT_BY_ID, (request: GetRequest) => {
      hook(request);
    });
  },

  afterGetDocumentById: (hook: (request: GetRequest, result: GetResult) => void) => {
    emitter.on(AFTER_GET_DOCUMENT_BY_ID, ([request, result]: AfterGet) => {
      hook(request, result);
    });
  },

  beforeUpdateDocumentById: (hook: (request: UpdateRequest) => void) => {
    emitter.on(BEFORE_UPDATE_DOCUMENT_BY_ID, (request: UpdateRequest) => {
      hook(request);
    });
  },

  afterUpdateDocumentById: (hook: (request: UpdateRequest, result: UpdateResult) => void) => {
    emitter.on(AFTER_UPDATE_DOCUMENT_BY_ID, ([request, result]: AfterUpdate) => {
      hook(request, result);
    });
  },

  beforeDeleteDocumentById: (hook: (request: DeleteRequest) => void) => {
    emitter.on(BEFORE_DELETE_DOCUMENT_BY_ID, (request: DeleteRequest) => {
      hook(request);
    });
  },

  afterDeleteDocumentById: (hook: (request: DeleteRequest, result: DeleteResult) => void) => {
    emitter.on(AFTER_DELETE_DOCUMENT_BY_ID, ([request, result]: AfterDelete) => {
      hook(request, result);
    });
  },

  beforeQueryDocuments: (hook: (request: QueryRequest) => void) => {
    emitter.on(BEFORE_QUERY_DOCUMENTS, (request: QueryRequest) => {
      hook(request);
    });
  },

  afterQueryDocuments: (hook: (request: QueryRequest, result: QueryResult) => void) => {
    emitter.on(AFTER_QUERY_DOCUMENTS, ([request, result]: AfterQuery) => {
      hook(request, result);
    });
  },
};
