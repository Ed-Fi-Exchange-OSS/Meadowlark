// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
// import { Client as ElasticSearchClient } from '@elastic/elasticsearch';
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
import { indexFromResourceInfo } from './QuerySearch';
import { handleSearchError } from './SearchException';
import { ClientSearch } from './ClientSearch';

const moduleName = 'search.repository.UpdateOpensearch';

/**
 * Parameters for an Search request
 */
type SearchRequest = { index: string; id: DocumentUuid };

/**
 * Listener for afterDeleteDocumentById events
 */
export async function afterDeleteDocumentById(request: DeleteRequest, result: DeleteResult, client: ClientSearch) {
  Logger.info(`${moduleName}.afterDeleteDocumentById`, request.traceId);
  if (result.response !== 'DELETE_SUCCESS') return;

  const opensearchRequest: SearchRequest = {
    id: request.documentUuid,
    index: indexFromResourceInfo(request.resourceInfo),
  };

  try {
    Logger.debug(
      `${moduleName}.afterDeleteDocumentById removing ${opensearchRequest.id} from index ${opensearchRequest.index}`,
      request.traceId,
    );
    await (client as any).delete({ ...opensearchRequest, refresh: true });
  } catch (err) {
    await handleSearchError(err, `${moduleName}.afterDeleteDocumentById`, request.traceId, opensearchRequest.id);
  }
}

/**
 * Shared search upsert logic
 */
async function upsertToSearch(request: UpsertRequest, documentUuid: DocumentUuid, client: ClientSearch) {
  const opensearchRequest: SearchRequest = {
    id: documentUuid,
    index: indexFromResourceInfo(request.resourceInfo),
  };

  Logger.debug(
    `${moduleName}.upsertTosearch inserting id ${opensearchRequest.id} into index ${opensearchRequest.index}`,
    request.traceId,
  );

  try {
    await (client as any).index({
      ...opensearchRequest,
      body: {
        id: opensearchRequest.id,
        info: JSON.stringify({ id: opensearchRequest.id, ...request.edfiDoc }),
        ...request.edfiDoc,
        createdBy: request.security.clientId,
        meadowlarkId: request.meadowlarkId,
        documentUuid,
      },
      refresh: true,
    });
  } catch (err) {
    await handleSearchError(err, `${moduleName}.upsertToSearch`, request.traceId, opensearchRequest.id);
  }
}

/**
 * Listener for afterUpsertDocument events
 */
export async function afterUpsertDocument(request: UpsertRequest, result: UpsertResult, client: ClientSearch) {
  Logger.info(`${moduleName}.afterUpsertDocument`, request.traceId);
  if (result.response !== 'UPDATE_SUCCESS' && result.response !== 'INSERT_SUCCESS') return;
  const documentUuid: DocumentUuid =
    result.response === 'UPDATE_SUCCESS' ? result.existingDocumentUuid : result.newDocumentUuid;
  await upsertToSearch(request, documentUuid, client);
}

/**
 * Listener for afterUpdateDocumentById events
 */
export async function afterUpdateDocumentById(request: UpdateRequest, result: UpdateResult, client: ClientSearch) {
  Logger.info(`${moduleName}.afterUpdateDocumentById`, request.traceId);
  if (result.response !== 'UPDATE_SUCCESS') return;
  await upsertToSearch(
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
