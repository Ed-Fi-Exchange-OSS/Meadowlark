// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export type { DocumentStorePlugin } from './plugin/backend/DocumentStorePlugin';
export { NoDocumentStorePlugin } from './plugin/backend/NoDocumentStorePlugin';
export type { QueryHandlerPlugin } from './plugin/backend/QueryHandlerPlugin';
export { NoQueryHandlerPlugin } from './plugin/backend/NoQueryHandlerPlugin';
export type { SystemTestClient, SystemTestablePlugin } from './plugin/backend/SystemTestablePlugin';
export { Subscribe } from './plugin/listener/Subscribe';
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
export type { Security } from './security/Security';
export { newSecurity, AuthorizationStrategy } from './security/Security';
export type { DocumentReference } from './model/DocumentReference';
export type { DocumentIdentity } from './model/DocumentIdentity';
export type { FrontendRequest, FrontendHeaders } from './handler/FrontendRequest';
export { newFrontendRequest } from './handler/FrontendRequest';
export type { FrontendResponse } from './handler/FrontendResponse';
export { newFrontendResponse } from './handler/FrontendResponse';
export { documentIdForDocumentIdentity } from './model/DocumentIdentity';
export { documentIdForDocumentReference } from './model/DocumentReference';
export type { DocumentInfo } from './model/DocumentInfo';
export { newDocumentInfo, documentIdForDocumentInfo, NoDocumentInfo } from './model/DocumentInfo';
export type { ResourceInfo } from './model/ResourceInfo';
export { newResourceInfo, NoResourceInfo } from './model/ResourceInfo';
export type { SuperclassInfo } from './model/SuperclassInfo';
export { newSuperclassInfo, documentIdForSuperclassInfo } from './model/SuperclassInfo';
export { Logger, initializeLogging, writeRequestToLog, isDebugEnabled } from './Logger';
export * as PluginLoader from './plugin/PluginLoader';
export type { MiddlewareModel } from './middleware/MiddlewareModel';
export { doNothingMiddleware } from './middleware/DoNothingMiddleware';

// Handlers
export { upsert, deleteIt, get, update } from './handler/FrontendFacade';
export { loadDescriptors } from './handler/DescriptorLoader';
export {
  apiVersion,
  metaed,
  openApiUrlList,
  swaggerForDescriptorsAPI,
  swaggerForResourcesAPI,
  dependencies,
} from './handler/MetadataHandler';
export { handler as oauthHandler } from './handler/OAuthHandler';
export { LOCATION_HEADER_NAME } from './handler/Upsert';
