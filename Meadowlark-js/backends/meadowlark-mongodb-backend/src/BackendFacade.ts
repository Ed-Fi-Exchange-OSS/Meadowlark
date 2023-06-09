// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DeleteRequest,
  DeleteResult,
  GetRequest,
  GetResult,
  MiddlewareModel,
  UpdateRequest,
  UpdateResult,
  UpsertRequest,
  UpsertResult,
} from '@edfi/meadowlark-core';
import {
  CreateAuthorizationClientRequest,
  CreateAuthorizationClientResult,
  GetAuthorizationClientRequest,
  GetAuthorizationClientResult,
  GetAllAuthorizationClientsResult,
  UpdateAuthorizationClientRequest,
  UpdateAuthorizationClientResult,
  ResetAuthorizationClientSecretResult,
  ResetAuthorizationClientSecretRequest,
  TryCreateBootstrapAuthorizationAdminResult,
} from '@edfi/meadowlark-authz-server';
import * as Upsert from './repository/Upsert';
import * as Delete from './repository/Delete';
import * as Get from './repository/Get';
import * as Update from './repository/Update';
import * as CreateAuthorizationClient from './repository/authorization/CreateAuthorizationClient';
import * as TryCreateBootstrapAuthorizationAdmin from './repository/authorization/TryCreateBootstrapAuthorizationAdmin';
import * as GetAuthorizationClient from './repository/authorization/GetAuthorizationClient';
import * as GetAllAuthorizationClients from './repository/authorization/GetAllAuthorizationClients';
import * as UpdateAuthorizationClient from './repository/authorization/UpdateAuthorizationClient';
import * as ResetAuthorizationClientSecret from './repository/authorization/ResetAuthorizationClientSecret';
import * as SecurityMiddleware from './security/SecurityMiddleware';
import { getSharedClient, closeSharedConnection } from './repository/Db';

// DocumentStore implementation
export async function deleteDocumentById(request: DeleteRequest): Promise<DeleteResult> {
  return Delete.deleteDocumentByDocumentUuid(request, await getSharedClient());
}

export async function getDocumentById(request: GetRequest): Promise<GetResult> {
  return Get.getDocumentByDocumentUuid(request, await getSharedClient());
}

export async function upsertDocument(request: UpsertRequest): Promise<UpsertResult> {
  return Upsert.upsertDocument(request, await getSharedClient());
}

export async function updateDocumentById(request: UpdateRequest): Promise<UpdateResult> {
  return Update.updateDocumentByDocumentUuid(request, await getSharedClient());
}

export async function securityMiddleware(middlewareModel: MiddlewareModel): Promise<MiddlewareModel> {
  return SecurityMiddleware.securityMiddleware(middlewareModel, await getSharedClient());
}

// AuthorizationStore implementation
export async function createAuthorizationClientDocument(
  request: CreateAuthorizationClientRequest,
): Promise<CreateAuthorizationClientResult> {
  return CreateAuthorizationClient.createAuthorizationClientDocument(request, await getSharedClient());
}

export async function tryCreateBootstrapAuthorizationAdminDocument(
  request: CreateAuthorizationClientRequest,
): Promise<TryCreateBootstrapAuthorizationAdminResult> {
  return TryCreateBootstrapAuthorizationAdmin.tryCreateBootstrapAuthorizationAdminDocument(request, await getSharedClient());
}

export async function getAuthorizationClientDocument(
  request: GetAuthorizationClientRequest,
): Promise<GetAuthorizationClientResult> {
  return GetAuthorizationClient.getAuthorizationClientDocument(request, await getSharedClient());
}

export async function getAllAuthorizationClientDocuments(traceId: string): Promise<GetAllAuthorizationClientsResult> {
  return GetAllAuthorizationClients.getAllAuthorizationClientDocuments(traceId, await getSharedClient());
}

export async function updateAuthorizationClientDocument(
  request: UpdateAuthorizationClientRequest,
): Promise<UpdateAuthorizationClientResult> {
  return UpdateAuthorizationClient.updateAuthorizationClientDocument(request, await getSharedClient());
}

export async function resetAuthorizationClientSecret(
  request: ResetAuthorizationClientSecretRequest,
): Promise<ResetAuthorizationClientSecretResult> {
  return ResetAuthorizationClientSecret.resetAuthorizationClientSecret(request, await getSharedClient());
}

export async function closeConnection(): Promise<void> {
  return closeSharedConnection();
}
