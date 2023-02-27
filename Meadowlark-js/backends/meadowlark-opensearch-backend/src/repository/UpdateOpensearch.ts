// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Client } from '@opensearch-project/opensearch';
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
import { indexFromResourceInfo } from './QueryOpensearch';
import { handleOpenSearchError } from './OpenSearchException';

const moduleName = 'opensearch.repository.UpdateOpensearch';

/**
 * Parameters for an OpenSearch request
 */
type OpensearchRequest = { index: string; id: DocumentUuid };

/**
 * Listener for afterDeleteDocumentById events
 */
export async function afterDeleteDocumentById(request: DeleteRequest, result: DeleteResult, client: Client) {
  Logger.info(`${moduleName}.afterDeleteDocumentById`, request.traceId);
  if (result.response !== 'DELETE_SUCCESS') return;

  const opensearchRequest: OpensearchRequest = {
    id: request.documentUuid,
    index: indexFromResourceInfo(request.resourceInfo),
  };

  try {
    Logger.debug(
      `${moduleName}.afterDeleteDocumentById removing ${opensearchRequest.id} from index ${opensearchRequest.index}`,
      request.traceId,
    );
    await client.delete({ ...opensearchRequest, refresh: true });
  } catch (err) {
    await handleOpenSearchError(err, `${moduleName}.afterDeleteDocumentById`, request.traceId, opensearchRequest.id);
  }
}

/**
 * Shared opensearch upsert logic
 */
async function upsertToOpensearch(request: UpsertRequest, client: Client) {
  const opensearchRequest: OpensearchRequest = {
    id: request.documentUuid,
    index: indexFromResourceInfo(request.resourceInfo),
  };

  Logger.debug(
    `${moduleName}.upsertToOpensearch inserting id ${opensearchRequest.id} into index ${opensearchRequest.index}`,
    request.traceId,
  );

  try {
    await client.index({
      ...opensearchRequest,
      body: {
        id: opensearchRequest.id,
        info: JSON.stringify({ id: opensearchRequest.id, ...request.edfiDoc }),
        ...request.edfiDoc,
        createdBy: request.security.clientId,
      },
      refresh: true,
    });
  } catch (err) {
    await handleOpenSearchError(err, `${moduleName}.upsertToOpensearch`, request.traceId, opensearchRequest.id);
  }
}

/**
 * Listener for afterUpsertDocument events
 */
export async function afterUpsertDocument(request: UpsertRequest, result: UpsertResult, client: Client) {
  Logger.info(`${moduleName}.afterUpsertDocument`, request.traceId);
  if (result.response !== 'UPDATE_SUCCESS' && result.response !== 'INSERT_SUCCESS') return;
  await upsertToOpensearch(request, client);
}

/**
 * Listener for afterUpdateDocumentById events
 */
export async function afterUpdateDocumentById(request: UpdateRequest, result: UpdateResult, client: Client) {
  Logger.info(`${moduleName}.afterUpdateDocumentById`, request.traceId);
  if (result.response !== 'UPDATE_SUCCESS') return;
  await upsertToOpensearch(request, client);
}
