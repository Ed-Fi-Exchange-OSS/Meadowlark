// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Client } from '@elastic/elasticsearch';
import {
  DeleteRequest,
  DeleteResult,
  DocumentUuid,
  UpdateRequest,
  UpdateResult,
  UpsertRequest,
  UpsertResult,
} from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { indexFromResourceInfo } from './QueryElasticsearch';
import { handleElasticSearchError } from './ElasticSearchException';

const moduleName = 'elasticsearch.repository.UpdateElasticsearch';

/**
 * Parameters for an ElasticSearch request
 */
type ElasticsearchRequest = { index: string; id: DocumentUuid };

/**
 * Listener for afterDeleteDocumentById events
 */
export async function afterDeleteDocumentById(request: DeleteRequest, result: DeleteResult, client: Client) {
  Logger.info(`${moduleName}.afterDeleteDocumentById`, request.traceId);
  if (result.response !== 'DELETE_SUCCESS') return;

  const elasticsearchRequest: ElasticsearchRequest = {
    id: request.documentUuid,
    index: indexFromResourceInfo(request.resourceInfo),
  };

  try {
    Logger.debug(
      `${moduleName}.afterDeleteDocumentById removing ${elasticsearchRequest.id} from index ${elasticsearchRequest.index}`,
      request.traceId,
    );
    await client.delete({ ...elasticsearchRequest, refresh: true });
  } catch (err) {
    await handleElasticSearchError(err, `${moduleName}.afterDeleteDocumentById`, request.traceId, elasticsearchRequest.id);
  }
}

/**
 * Shared elasticsearch upsert logic
 */
async function upsertToElasticsearch(request: UpsertRequest, documentUuid: DocumentUuid, client: Client) {
  const elasticsearchRequest: ElasticsearchRequest = {
    id: documentUuid,
    index: indexFromResourceInfo(request.resourceInfo),
  };

  Logger.debug(
    `${moduleName}.upsertToElasticsearch inserting id ${elasticsearchRequest.id} into index ${elasticsearchRequest.index}`,
    request.traceId,
  );

  try {
    await client.index({
      ...elasticsearchRequest,
      body: {
        id: elasticsearchRequest.id,
        info: JSON.stringify({ id: elasticsearchRequest.id, ...request.edfiDoc }),
        ...request.edfiDoc,
        createdBy: request.security.clientId,
        meadowlarkId: request.meadowlarkId,
        documentUuid,
      },
      refresh: true,
    });
  } catch (err) {
    await handleElasticSearchError(err, `${moduleName}.upsertToElasticsearch`, request.traceId, elasticsearchRequest.id);
  }
}

/**
 * Listener for afterUpsertDocument events
 */
export async function afterUpsertDocument(request: UpsertRequest, result: UpsertResult, client: Client) {
  Logger.info(`${moduleName}.afterUpsertDocument`, request.traceId);
  if (result.response !== 'UPDATE_SUCCESS' && result.response !== 'INSERT_SUCCESS') return;
  const documentUuid: DocumentUuid =
    result.response === 'UPDATE_SUCCESS' ? result.existingDocumentUuid : result.newDocumentUuid;
  await upsertToElasticsearch(request, documentUuid, client);
}

/**
 * Listener for afterUpdateDocumentById events
 */
export async function afterUpdateDocumentById(request: UpdateRequest, result: UpdateResult, client: Client) {
  Logger.info(`${moduleName}.afterUpdateDocumentById`, request.traceId);
  if (result.response !== 'UPDATE_SUCCESS') return;
  await upsertToElasticsearch(
    {
      meadowlarkId: request.meadowlarkId,
      resourceInfo: request.resourceInfo,
      documentInfo: request.documentInfo,
      edfiDoc: request.edfiDoc,
      validateDocumentReferencesExist: request.validateDocumentReferencesExist,
      security: request.security,
      traceId: request.traceId,
    },
    request.documentUuid,
    client,
  );
}
