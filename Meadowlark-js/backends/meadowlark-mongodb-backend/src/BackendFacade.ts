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
import { CreateClientRequest, CreateClientResult } from '@edfi/meadowlark-authz-server';
import * as Upsert from './repository/Upsert';
import * as Delete from './repository/Delete';
import * as Get from './repository/Get';
import * as Update from './repository/Update';
import * as CreateClient from './repository/authorization/CreateClient';
import * as SecurityMiddleware from './security/SecurityMiddleware';
import { getSharedClient } from './repository/Db';

export async function deleteDocumentById(request: DeleteRequest): Promise<DeleteResult> {
  return Delete.deleteDocumentById(request, await getSharedClient());
}

export async function getDocumentById(request: GetRequest): Promise<GetResult> {
  return Get.getDocumentById(request, await getSharedClient());
}

export async function upsertDocument(request: UpsertRequest): Promise<UpsertResult> {
  return Upsert.upsertDocument(request, await getSharedClient());
}

export async function updateDocumentById(request: UpdateRequest): Promise<UpdateResult> {
  return Update.updateDocumentById(request, await getSharedClient());
}

export async function securityMiddleware(middlewareModel: MiddlewareModel): Promise<MiddlewareModel> {
  return SecurityMiddleware.securityMiddleware(middlewareModel, await getSharedClient());
}

export async function createAuthorizationClient(request: CreateClientRequest): Promise<CreateClientResult> {
  return CreateClient.createAuthorizationClient(request, await getSharedClient());
}
