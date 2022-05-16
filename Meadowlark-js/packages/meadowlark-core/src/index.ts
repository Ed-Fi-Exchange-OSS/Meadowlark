// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export type { DocumentStorePlugin } from './plugin/backend/DocumentStorePlugin';
export { NoDocumentStorePlugin } from './plugin/backend/NoDocumentStorePlugin';
export type { QueryHandlerPlugin } from './plugin/backend/QueryHandlerPlugin';
export { NoQueryHandlerPlugin } from './plugin/backend/NoQueryHandlerPlugin';
export type { Subscribe } from './plugin/listener/Subscribe';
export type { GetResult } from './message/GetResult';
export type { DeleteResult } from './message/DeleteResult';
export type { UpdateResult } from './message/UpdateResult';
export type { UpsertResult } from './message/UpsertResult';
export type { QueryResult } from './message/QueryResult';
export type { GetRequest } from './message/GetRequest';
export type { DeleteRequest } from './message/DeleteRequest';
export type { UpdateRequest } from './message/UpdateRequest';
export type { UpsertRequest } from './message/UpsertRequest';
export type { QueryRequest } from './message/QueryRequest';
export type { PaginationParameters } from './message/PaginationParameters';
export type { Security } from './model/Security';
export { newSecurity } from './model/Security';
export type { DocumentElement } from './model/DocumentElement';
export type { DocumentReference } from './model/DocumentReference';
export type { DocumentIdentity } from './model/DocumentIdentity';
export type { FrontendRequest } from './handler/FrontendRequest';
export type { FrontendResponse } from './handler/FrontendResponse';
export {
  documentIdForDocumentInfo,
  documentIdForDocumentReference,
  documentIdForDocumentIdentifyingInfo,
} from './model/DocumentId';
export type { DocumentInfo, DocumentIdentifyingInfo, DocumentTypeInfo } from './model/DocumentInfo';
export { newDocumentInfo, NoDocumentInfo } from './model/DocumentInfo';
export { Logger } from './Logger';
export * as PluginLoader from './plugin/PluginLoader';

// Handlers
export { upsert } from './handler/Upsert';
export { deleteIt } from './handler/Delete';
export { getResolver } from './handler/Get';
export { update } from './handler/Update';
export { loadDescriptors } from './handler/DescriptorLoader';
export {
  apiVersion,
  metaed,
  openApiUrlList,
  swaggerForDescriptorsAPI,
  swaggerForResourcesAPI,
} from './handler/MetadataHandler';
export { handler as oauthHandler } from './handler/OAuthHandler';
