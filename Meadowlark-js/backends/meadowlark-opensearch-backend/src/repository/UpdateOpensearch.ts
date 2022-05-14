// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Client } from '@elastic/elasticsearch';
import {
  DeleteRequest,
  DeleteResult,
  DocumentInfo,
  Logger,
  UpdateRequest,
  UpdateResult,
  UpsertRequest,
  UpsertResult,
  documentIdForDocumentInfo,
} from '@edfi/meadowlark-core';
import { indexFromDocumentInfo } from './QueryOpensearch';

/**
 * Parameters for an Elasticsearch request
 */
type OpensearchRequest = { index: string; id: string };

/**
 * Build the Elasticsearch request parameters.
 */
function buildOpensearchRequest(documentInfo: DocumentInfo): OpensearchRequest {
  return {
    index: indexFromDocumentInfo(documentInfo),
    id: documentIdForDocumentInfo(documentInfo),
  };
}

/**
 * Listener for afterDeleteDocumentById events
 */
export async function afterDeleteDocumentById(request: DeleteRequest, result: DeleteResult, client: Client) {
  Logger.info('UpdateOpenSearch.afterDeleteDocumentById', request.traceId);
  if (result.response !== 'DELETE_SUCCESS') return;

  const requestParams = buildOpensearchRequest(request.documentInfo);

  try {
    Logger.debug(`Checking if ${requestParams.index} exists in ElasticSearch`, request.traceId);
    if ((await client.exists({ ...requestParams, refresh: true })).body) {
      Logger.debug(`UpdateOpensearch.afterDeleteDocumentById removing ${requestParams.index}`, request.traceId);
      await client.delete({ ...requestParams, refresh: true });
    }
  } catch (err) {
    Logger.error(`UpdateOpensearch.afterDeleteDocumentById`, request.traceId, 'n/a', err);
  }
}

/**
 * Shared opensearch upsert logic
 */
async function upsertToOpensearch(request: UpsertRequest, client: Client) {
  const requestParams = buildOpensearchRequest(request.documentInfo);

  // Ignore if a descriptor.
  if (request.documentInfo.isDescriptor) {
    Logger.debug(
      `UpdateOpensearch.upsertToOpensearch Skipping ${JSON.stringify(requestParams)} since it is a descriptor entity`,
      request.traceId,
    );
    return;
  }

  Logger.debug(`UpdateOpensearch.upsertToOpensearch Insert ${requestParams.index} into ElasticSearch`, request.traceId);
  try {
    await client.index({
      ...requestParams,
      body: {
        id: requestParams.id,
        info: JSON.stringify({ id: requestParams.id, ...request.edfiDoc }),
        ...request.edfiDoc,
      },
      refresh: true,
    });
  } catch (err) {
    Logger.error(`DynamoDbStreamHandler.upsertToOpensearch`, request.traceId, 'n/a', err);
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
