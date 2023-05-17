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
import type { PoolClient } from 'pg';

import * as Upsert from './repository/Upsert';
import * as Delete from './repository/Delete';
import * as Get from './repository/Get';
import * as Update from './repository/Update';
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

export async function closeConnection(): Promise<void> {
  return closeSharedConnection();
}
