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
// import * as Delete from './repository/Delete';
import * as Read from './repository/Read';
// import * as Update from './repository/Update';
import { getSharedClient } from './repository/Db';
import * as SecurityMiddleware from './security/SecurityMiddleware';

// @ts-ignore
export async function deleteDocumentById(request: DeleteRequest): Promise<DeleteResult> {
  return { response: 'UNKNOWN_FAILURE' };
  // return Delete.deleteDocumentById(request, await getSharedClient());
}

export async function getDocumentById(request: GetRequest): Promise<GetResult> {
  const client = await getSharedClient();
  try {
    return Read.getDocumentById(request, client);
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

// @ts-ignore
export async function updateDocumentById(request: UpdateRequest): Promise<UpdateResult> {
  return { response: 'UNKNOWN_FAILURE', failureMessage: '' };
  // return Update.updateDocumentById(request, await getSharedClient());
}

export async function securityMiddleware(middlewareModel: MiddlewareModel): Promise<MiddlewareModel> {
  return SecurityMiddleware.securityMiddleware(middlewareModel, await getSharedClient());
}
