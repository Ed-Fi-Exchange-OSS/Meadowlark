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

import {
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
} from './Subscribe';

export function beforeUpsertDocument(request: UpsertRequest) {
  PubSub.publish(BEFORE_UPSERT_DOCUMENT, request);
}

export function afterUpsertDocument(request: UpsertRequest, result: UpsertResult) {
  PubSub.publish(AFTER_UPSERT_DOCUMENT, { request, result });
}

export function beforeGetDocumentById(request: GetRequest) {
  PubSub.publish(BEFORE_GET_DOCUMENT_BY_ID, request);
}

export function afterGetDocumentById(request: GetRequest, result: GetResult) {
  PubSub.publish(AFTER_GET_DOCUMENT_BY_ID, { request, result });
}

export function beforeUpdateDocumentById(request: UpdateRequest) {
  PubSub.publish(BEFORE_UPDATE_DOCUMENT_BY_ID, request);
}

export function afterUpdateDocumentById(request: UpdateRequest, result: UpdateResult) {
  PubSub.publish(AFTER_UPDATE_DOCUMENT_BY_ID, { request, result });
}

export function beforeDeleteDocumentById(request: DeleteRequest) {
  PubSub.publish(BEFORE_DELETE_DOCUMENT_BY_ID, request);
}

export function afterDeleteDocumentById(request: DeleteRequest, result: DeleteResult) {
  PubSub.publish(AFTER_DELETE_DOCUMENT_BY_ID, { request, result });
}

export function beforeQueryDocuments(request: QueryRequest) {
  PubSub.publish(BEFORE_QUERY_DOCUMENTS, request);
}

export function afterQueryDocuments(request: QueryRequest, result: QueryResult) {
  PubSub.publish(AFTER_QUERY_DOCUMENTS, { request, result });
}
