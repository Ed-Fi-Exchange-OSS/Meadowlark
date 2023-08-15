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
import type { PoolClient } from 'pg';

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

import { getSharedClient, closeSharedConnection } from './repository/Db';
import * as SecurityMiddleware from './security/SecurityMiddleware';

export async function deleteDocumentById(request: DeleteRequest): Promise<DeleteResult> {
  const poolClient: PoolClient = await getSharedClient();
  try {
    return Delete.deleteDocumentByDocumentUuid(request, poolClient);
  } finally {
    poolClient.release();
  }
}

export async function getDocumentById(request: GetRequest): Promise<GetResult> {
  const poolClient: PoolClient = await getSharedClient();
  try {
    return Get.getDocumentByDocumentUuid(request, poolClient);
  } finally {
    poolClient.release();
  }
}

export async function upsertDocument(request: UpsertRequest): Promise<UpsertResult> {
  const poolClient: PoolClient = await getSharedClient();
  try {
    return Upsert.upsertDocument(request, poolClient);
  } finally {
    poolClient.release();
  }
}

export async function updateDocumentById(request: UpdateRequest): Promise<UpdateResult> {
  const poolClient: PoolClient = await getSharedClient();
  try {
    return Update.updateDocumentByDocumentUuid(request, poolClient);
  } finally {
    poolClient.release();
  }
}

export async function securityMiddleware(middlewareModel: MiddlewareModel): Promise<MiddlewareModel> {
  const poolClient: PoolClient = await getSharedClient();
  try {
    return SecurityMiddleware.securityMiddleware(middlewareModel, poolClient);
  } finally {
    poolClient.release();
  }
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
// End AuthorizationStore implementation

export async function closeConnection(): Promise<void> {
  return closeSharedConnection();
}
