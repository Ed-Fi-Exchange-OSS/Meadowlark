import Emittery from 'emittery';
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

export const BEFORE_UPSERT_DOCUMENT = Symbol('BEFORE_UPSERT_DOCUMENT');
export const AFTER_UPSERT_DOCUMENT = Symbol('AFTER_UPSERT_DOCUMENT');
export const BEFORE_GET_DOCUMENT_BY_ID = Symbol('BEFORE_GET_DOCUMENT_BY_ID');
export const AFTER_GET_DOCUMENT_BY_ID = Symbol('AFTER_GET_DOCUMENT_BY_ID');
export const BEFORE_UPDATE_DOCUMENT_BY_ID = Symbol('BEFORE_UPDATE_DOCUMENT_BY_ID');
export const AFTER_UPDATE_DOCUMENT_BY_ID = Symbol('AFTER_UPDATE_DOCUMENT_BY_ID');
export const BEFORE_DELETE_DOCUMENT_BY_ID = Symbol('BEFORE_DELETE_DOCUMENT_BY_ID');
export const AFTER_DELETE_DOCUMENT_BY_ID = Symbol('AFTER_DELETE_DOCUMENT_BY_ID');
export const BEFORE_QUERY_DOCUMENTS = Symbol('BEFORE_QUERY_DOCUMENTS');
export const AFTER_QUERY_DOCUMENTS = Symbol('AFTER_QUERY_DOCUMENTS');

export const emitter: Emittery = new Emittery();

export function beforeUpsertDocument(request: UpsertRequest) {
  emitter.emit(BEFORE_UPSERT_DOCUMENT, request);
}

export function afterUpsertDocument(request: UpsertRequest, result: UpsertResult) {
  emitter.emit(AFTER_UPSERT_DOCUMENT, [request, result]);
}

export function beforeGetDocumentById(request: GetRequest) {
  emitter.emit(BEFORE_GET_DOCUMENT_BY_ID, request);
}

export function afterGetDocumentById(request: GetRequest, result: GetResult) {
  emitter.emit(AFTER_GET_DOCUMENT_BY_ID, [request, result]);
}

export function beforeUpdateDocumentById(request: UpdateRequest) {
  emitter.emit(BEFORE_UPDATE_DOCUMENT_BY_ID, request);
}

export function afterUpdateDocumentById(request: UpdateRequest, result: UpdateResult) {
  emitter.emit(AFTER_UPDATE_DOCUMENT_BY_ID, [request, result]);
}

export function beforeDeleteDocumentById(request: DeleteRequest) {
  emitter.emit(BEFORE_DELETE_DOCUMENT_BY_ID, request);
}

export function afterDeleteDocumentById(request: DeleteRequest, result: DeleteResult) {
  emitter.emit(AFTER_DELETE_DOCUMENT_BY_ID, [request, result]);
}

export function beforeQueryDocuments(request: QueryRequest) {
  emitter.emit(BEFORE_QUERY_DOCUMENTS, request);
}

export function afterQueryDocuments(request: QueryRequest, result: QueryResult) {
  emitter.emit(AFTER_QUERY_DOCUMENTS, [request, result]);
}
