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

export async function beforeUpsertDocument(request: UpsertRequest) {
  await emitter.emit(BEFORE_UPSERT_DOCUMENT, request);
}

export async function afterUpsertDocument(request: UpsertRequest, result: UpsertResult) {
  await emitter.emit(AFTER_UPSERT_DOCUMENT, [request, result]);
}

export async function beforeGetDocumentById(request: GetRequest) {
  await emitter.emit(BEFORE_GET_DOCUMENT_BY_ID, request);
}

export async function afterGetDocumentById(request: GetRequest, result: GetResult) {
  await emitter.emit(AFTER_GET_DOCUMENT_BY_ID, [request, result]);
}

export async function beforeUpdateDocumentById(request: UpdateRequest) {
  await emitter.emit(BEFORE_UPDATE_DOCUMENT_BY_ID, request);
}

export async function afterUpdateDocumentById(request: UpdateRequest, result: UpdateResult) {
  await emitter.emit(AFTER_UPDATE_DOCUMENT_BY_ID, [request, result]);
}

export async function beforeDeleteDocumentById(request: DeleteRequest) {
  await emitter.emit(BEFORE_DELETE_DOCUMENT_BY_ID, request);
}

export async function afterDeleteDocumentById(request: DeleteRequest, result: DeleteResult) {
  await emitter.emit(AFTER_DELETE_DOCUMENT_BY_ID, [request, result]);
}

export async function beforeQueryDocuments(request: QueryRequest) {
  await emitter.emit(BEFORE_QUERY_DOCUMENTS, request);
}

export async function afterQueryDocuments(request: QueryRequest, result: QueryResult) {
  await emitter.emit(AFTER_QUERY_DOCUMENTS, [request, result]);
}
