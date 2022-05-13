// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import PubSub from 'pubsub-js';

import { DeleteRequest } from '../../message/DeleteRequest';
import { DeleteResult } from '../../message/DeleteResult';
import { GetRequest } from '../../message/GetRequest';
import { GetResult } from '../../message/GetResult';
import { QueryRequest } from '../../message/QueryRequest';
import { QueryResult } from '../../message/QueryResult';
import { UpdateRequest } from '../../message/UpdateRequest';
import { UpdateResult } from '../../message/UpdateResult';
import { UpsertRequest } from '../../message/UpsertRequest';
import { UpsertResult } from '../../message/UpsertResult';

type AfterUpsert = { request: UpsertRequest; result: UpsertResult };
type AfterGet = { request: GetRequest; result: GetResult };
type AfterUpdate = { request: UpdateRequest; result: UpdateResult };
type AfterDelete = { request: DeleteRequest; result: DeleteResult };
type AfterQuery = { request: QueryRequest; result: QueryResult };

export const BEFORE_UPSERT_DOCUMENT: string = 'BEFORE_UPSERT_DOCUMENT';
export const AFTER_UPSERT_DOCUMENT: string = 'AFTER_UPSERT_DOCUMENT';
export const BEFORE_GET_DOCUMENT_BY_ID: string = 'BEFORE_GET_DOCUMENT_BY_ID';
export const AFTER_GET_DOCUMENT_BY_ID: string = 'AFTER_GET_DOCUMENT_BY_ID';
export const BEFORE_UPDATE_DOCUMENT_BY_ID: string = 'BEFORE_UPDATE_DOCUMENT_BY_ID';
export const AFTER_UPDATE_DOCUMENT_BY_ID: string = 'AFTER_UPDATE_DOCUMENT_BY_ID';
export const BEFORE_DELETE_DOCUMENT_BY_ID: string = 'BEFORE_DELETE_DOCUMENT_BY_ID';
export const AFTER_DELETE_DOCUMENT_BY_ID: string = 'AFTER_DELETE_DOCUMENT_BY_ID';
export const BEFORE_QUERY_DOCUMENTS: string = 'BEFORE_QUERY_DOCUMENTS';
export const AFTER_QUERY_DOCUMENTS: string = 'AFTER_QUERY_DOCUMENTS';

export class Subscribe {
  static beforeUpsertDocument(hook: (request: UpsertRequest) => void) {
    PubSub.subscribe(BEFORE_UPSERT_DOCUMENT, (_, data: UpsertRequest) => {
      hook(data);
    });
  }

  static afterUpsertDocument(hook: (request: UpsertRequest, result: UpsertResult) => void) {
    PubSub.subscribe(AFTER_UPSERT_DOCUMENT, (_, data: AfterUpsert) => {
      hook(data.request, data.result);
    });
  }

  static beforeGetDocumentById(hook: (request: GetRequest) => void) {
    PubSub.subscribe(BEFORE_GET_DOCUMENT_BY_ID, (_, data: GetRequest) => {
      hook(data);
    });
  }

  static afterGetDocumentById(hook: (request: GetRequest, result: GetResult) => void) {
    PubSub.subscribe(AFTER_GET_DOCUMENT_BY_ID, (_, data: AfterGet) => {
      hook(data.request, data.result);
    });
  }

  static beforeUpdateDocumentById(hook: (request: UpdateRequest) => void) {
    PubSub.subscribe(BEFORE_UPDATE_DOCUMENT_BY_ID, (_, data: UpdateRequest) => {
      hook(data);
    });
  }

  static afterUpdateDocumentById(hook: (request: UpdateRequest, result: UpdateResult) => void) {
    PubSub.subscribe(AFTER_UPDATE_DOCUMENT_BY_ID, (_, data: AfterUpdate) => {
      hook(data.request, data.result);
    });
  }

  static beforeDeleteDocumentById(hook: (request: DeleteRequest) => void) {
    PubSub.subscribe(BEFORE_DELETE_DOCUMENT_BY_ID, (_, data: DeleteRequest) => {
      hook(data);
    });
  }

  static afterDeleteDocumentById(hook: (request: DeleteRequest, result: DeleteResult) => void) {
    PubSub.subscribe(AFTER_DELETE_DOCUMENT_BY_ID, (_, data: AfterDelete) => {
      hook(data.request, data.result);
    });
  }

  static beforeQueryDocuments(hook: (request: QueryRequest) => void) {
    PubSub.subscribe(BEFORE_QUERY_DOCUMENTS, (_, data: QueryRequest) => {
      hook(data);
    });
  }

  static afterQueryDocuments(hook: (request: QueryRequest, result: QueryResult) => void) {
    PubSub.subscribe(AFTER_QUERY_DOCUMENTS, (_, data: AfterQuery) => {
      hook(data.request, data.result);
    });
  }
}
