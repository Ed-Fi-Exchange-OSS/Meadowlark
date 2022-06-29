// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Client } from '@opensearch-project/opensearch';
import {
  DeleteRequest,
  DeleteResult,
  Logger,
  UpdateRequest,
  UpdateResult,
  UpsertRequest,
  UpsertResult,
} from '@edfi/meadowlark-core';
import { indexFromResourceInfo } from './QueryOpensearch';

/**
 * Parameters for an OpenSearch request
 */
type OpensearchRequest = { index: string; id: string };

/**
 * Listener for afterDeleteDocumentById events
 */
export async function afterDeleteDocumentById(request: DeleteRequest, result: DeleteResult, client: Client) {
  Logger.info('UpdateOpenSearch.afterDeleteDocumentById', request.traceId);
  if (result.response !== 'DELETE_SUCCESS') return;

  const opensearchRequest: OpensearchRequest = { id: request.id, index: indexFromResourceInfo(request.resourceInfo) };

  try {
    Logger.debug(
      `UpdateOpensearch.afterDeleteDocumentById removing ${opensearchRequest.id} from index ${opensearchRequest.index}`,
      request.traceId,
    );
    await client.delete({ ...opensearchRequest, refresh: true });
  } catch (err) {
    Logger.error(`UpdateOpensearch.afterDeleteDocumentById`, request.traceId, err);
    throw err;
  }
}

/**
 * Shared opensearch upsert logic
 */
async function upsertToOpensearch(request: UpsertRequest, client: Client) {
  const opensearchRequest: OpensearchRequest = { id: request.id, index: indexFromResourceInfo(request.resourceInfo) };

  // Ignore if a descriptor.
  if (request.resourceInfo.isDescriptor) {
    Logger.debug(
      `UpdateOpensearch.upsertToOpensearch Skipping ${JSON.stringify(opensearchRequest)} since it is a descriptor entity`,
      request.traceId,
    );
    return;
  }

  Logger.debug(
    `UpdateOpensearch.upsertToOpensearch inserting id ${opensearchRequest.id} into index ${opensearchRequest.index}`,
    request.traceId,
  );
  try {
    await client.index({
      ...opensearchRequest,
      body: {
        id: opensearchRequest.id,
        info: JSON.stringify({ id: opensearchRequest.id, ...request.edfiDoc }),
        ...request.edfiDoc,
        createdBy: request.security.clientName,
      },
      refresh: true,
    });
  } catch (err) {
    Logger.error(`UpdateOpensearch.upsertToOpensearch`, request.traceId, err);
    throw err;
  }
}

/**
 * Listener for afterUpsertDocument events
 */
export async function afterUpsertDocument(request: UpsertRequest, result: UpsertResult, client: Client) {
  Logger.info('UpdateOpenSearch.afterUpsertDocument', request.traceId);
  if (result.response !== 'UPDATE_SUCCESS' && result.response !== 'INSERT_SUCCESS') return;
  upsertToOpensearch(request, client);
}

/**
 * Listener for afterUpdateDocumentById events
 */
export async function afterUpdateDocumentById(request: UpdateRequest, result: UpdateResult, client: Client) {
  Logger.info('UpdateOpenSearch.afterUpdateDocumentById', request.traceId);
  if (result.response !== 'UPDATE_SUCCESS') return;
  upsertToOpensearch(request, client);
}
