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

import * as Upsert from './repository/Upsert';
import * as Delete from './repository/Delete';
import * as Get from './repository/Get';
import * as Update from './repository/Update';
import { getSharedClient } from './repository/Db';
import * as SecurityMiddleware from './security/SecurityMiddleware';

export async function deleteDocumentById(request: DeleteRequest): Promise<DeleteResult> {
  const client = await getSharedClient();
  try {
    return Delete.deleteDocumentById(request, client);
  } finally {
    client.release();
  }
}

export async function getDocumentById(request: GetRequest): Promise<GetResult> {
  const client = await getSharedClient();
  try {
    return Get.getDocumentById(request, client);
  } finally {
    client.release();
  }
}

export async function upsertDocument(request: UpsertRequest): Promise<UpsertResult> {
  const client = await getSharedClient();
  try {
    return Upsert.upsertDocument(request, client);
  } finally {
    client.release();
  }
}

export async function updateDocumentById(request: UpdateRequest): Promise<UpdateResult> {
  const client = await getSharedClient();
  try {
    return Update.updateDocumentById(request, client);
  } finally {
    client.release();
  }
}

export async function securityMiddleware(middlewareModel: MiddlewareModel): Promise<MiddlewareModel> {
  return SecurityMiddleware.securityMiddleware(middlewareModel, await getSharedClient());
}
