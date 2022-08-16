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
  beforeUpsertDocument: (hook: (request: UpsertRequest) => Promise<void>) => {
    emitter.on(BEFORE_UPSERT_DOCUMENT, async (request: UpsertRequest) => {
      await hook(request);
    });
  },

  afterUpsertDocument: (hook: (request: UpsertRequest, result: UpsertResult) => Promise<void>) => {
    emitter.on(AFTER_UPSERT_DOCUMENT, async ([request, result]: AfterUpsert) => {
      await hook(request, result);
    });
  },

  beforeGetDocumentById: (hook: (rrequest: GetRequest) => Promise<void>) => {
    emitter.on(BEFORE_GET_DOCUMENT_BY_ID, async (request: GetRequest) => {
      await hook(request);
    });
  },

  afterGetDocumentById: (hook: (request: GetRequest, result: GetResult) => Promise<void>) => {
    emitter.on(AFTER_GET_DOCUMENT_BY_ID, async ([request, result]: AfterGet) => {
      await hook(request, result);
    });
  },

  beforeUpdateDocumentById: (hook: (request: UpdateRequest) => Promise<void>) => {
    emitter.on(BEFORE_UPDATE_DOCUMENT_BY_ID, async (request: UpdateRequest) => {
      await hook(request);
    });
  },

  afterUpdateDocumentById: (hook: (request: UpdateRequest, result: UpdateResult) => Promise<void>) => {
    emitter.on(AFTER_UPDATE_DOCUMENT_BY_ID, async ([request, result]: AfterUpdate) => {
      await hook(request, result);
    });
  },

  beforeDeleteDocumentById: (hook: (request: DeleteRequest) => Promise<void>) => {
    emitter.on(BEFORE_DELETE_DOCUMENT_BY_ID, async (request: DeleteRequest) => {
      await hook(request);
    });
  },

  afterDeleteDocumentById: (hook: (request: DeleteRequest, result: DeleteResult) => Promise<void>) => {
    emitter.on(AFTER_DELETE_DOCUMENT_BY_ID, async ([request, result]: AfterDelete) => {
      await hook(request, result);
    });
  },

  beforeQueryDocuments: (hook: (request: QueryRequest) => Promise<void>) => {
    emitter.on(BEFORE_QUERY_DOCUMENTS, async (request: QueryRequest) => {
      await hook(request);
    });
  },

  afterQueryDocuments: (hook: (request: QueryRequest, result: QueryResult) => Promise<void>) => {
    emitter.on(AFTER_QUERY_DOCUMENTS, async ([request, result]: AfterQuery) => {
      await hook(request, result);
    });
  },
};
