// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { ElasticsearchClientError, ResponseError } from '@elastic/transport/lib/errors';
import { Logger } from '@edfi/meadowlark-utilities';
import { QueryResult } from '@edfi/meadowlark-core';

export async function handleElasticSearchError(
  err: ElasticsearchClientError | Error,
  moduleName: string = '',
  traceId: string = '',
  elasticSearchRequestId: string = '',
): Promise<QueryResult> {
  try {
    const elasticSearchClientError = err as ElasticsearchClientError;
    const documentProcessError = `ElasticSearch Error${
      elasticSearchRequestId ? ` processing the object '${elasticSearchRequestId}'` : ''
    }:`;
    if (elasticSearchClientError?.name !== undefined) {
      switch (elasticSearchClientError.name) {
        case 'ConfigurationError':
        case 'ConnectionError':
        case 'RequestAbortedError':
        case 'TimeoutError': {
          if (elasticSearchClientError?.message !== undefined) {
            Logger.error(
              `${moduleName} ${documentProcessError}`,
              traceId,
              `(${elasticSearchClientError.name}) - ${elasticSearchClientError.message}`,
            );
            return {
              response: 'QUERY_FAILURE_CONNECTION_ERROR',
              documents: [],
              failureMessage: elasticSearchClientError.message,
            };
          }
          break;
        }
        case 'ResponseError': {
          const responseException = err as ResponseError;
          if (responseException?.message !== undefined) {
            if (responseException.message !== 'Response Error') {
              if (responseException?.message.indexOf('index_not_found_exception') !== -1) {
                Logger.warn(`${moduleName} ${documentProcessError} index not found`, traceId);
                return {
                  response: 'QUERY_FAILURE_INDEX_NOT_FOUND',
                  documents: [],
                  failureMessage: 'IndexNotFoundException',
                };
              }
              Logger.error(
                `${moduleName} ${documentProcessError}`,
                traceId,
                `(${elasticSearchClientError.name}) - ${elasticSearchClientError.message}`,
              );
              return { response: 'QUERY_FAILURE_INVALID_QUERY', documents: [], failureMessage: responseException.message };
            }
          }
          break;
        }
        case 'DeserializationError':
        case 'NoLivingConnectionsError':
        case 'NotCompatibleError':
        case 'ElasticsearchClientError':
        case 'SerializationError':
        default: {
          break;
        }
      }
    }
    Logger.error(`${moduleName} UNKNOWN_FAILURE`, traceId, err);
    return { response: 'UNKNOWN_FAILURE', documents: [], failureMessage: err.message };
  } catch {
    Logger.error(`${moduleName} UNKNOWN_FAILURE`, traceId, err);
    return { response: 'UNKNOWN_FAILURE', documents: [], failureMessage: err.message };
  }
}
