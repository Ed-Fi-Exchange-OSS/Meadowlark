// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Client } from '@elastic/elasticsearch';
import {
  DeleteRequest,
  DeleteResult,
  Logger,
  UpdateRequest,
  UpdateResult,
  UpsertRequest,
  UpsertResult,
} from '@edfi/meadowlark-core';
import { indexFromDocumentInfo } from './QueryOpensearch';

/**
 * Parameters for an Elasticsearch request
 */
type OpensearchRequest = { index: string; id: string };

/**
 * Listener for afterDeleteDocumentById events
 */
export async function afterDeleteDocumentById(request: DeleteRequest, result: DeleteResult, client: Client) {
  Logger.info('UpdateOpenSearch.afterDeleteDocumentById', request.traceId);
  if (result.response !== 'DELETE_SUCCESS') return;

  const opensearchRequest: OpensearchRequest = { id: request.id, index: indexFromDocumentInfo(request.documentInfo) };

  try {
    Logger.debug(
      `UpdateOpensearch.afterDeleteDocumentById removing ${opensearchRequest.id} from index ${opensearchRequest.index}`,
      request.traceId,
    );
    await client.delete({ ...opensearchRequest, refresh: true });
  } catch (err) {
    Logger.error(`UpdateOpensearch.afterDeleteDocumentById`, request.traceId, err);
  }
}

/**
 * Shared opensearch upsert logic
 */
async function upsertToOpensearch(request: UpsertRequest, client: Client) {
  const opensearchRequest: OpensearchRequest = { id: request.id, index: indexFromDocumentInfo(request.documentInfo) };

  // Ignore if a descriptor.
  if (request.documentInfo.isDescriptor) {
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
      },
      refresh: true,
    });
  } catch (err) {
    Logger.error(`DynamoDbStreamHandler.upsertToOpensearch`, request.traceId, err);
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
