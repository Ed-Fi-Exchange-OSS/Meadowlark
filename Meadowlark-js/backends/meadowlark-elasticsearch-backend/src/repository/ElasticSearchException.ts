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
        case 'DeserializationError':
        case 'NoLivingConnectionsError':
        case 'NotCompatibleError':
        case 'ElasticSearchClientError':
        case 'RequestAbortedError':
        case 'SerializationError':
        case 'TimeoutError': {
          if (elasticSearchClientError?.message !== undefined) {
            Logger.error(
              `${moduleName} ${documentProcessError}`,
              traceId,
              `(${elasticSearchClientError.name}) - ${elasticSearchClientError.message}`,
            );
            return {
              response: 'QUERY_FAILURE_INVALID_QUERY',
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
              let startPosition = responseException?.message?.indexOf('Reason:');
              const position = responseException?.message?.indexOf(' Preview');
              startPosition = startPosition > -1 ? startPosition : 0;
              if (position > -1) {
                responseException.message = responseException?.message?.substring(startPosition, position);
              } else if (startPosition !== 0) {
                responseException.message = responseException?.message?.substring(startPosition);
              }
              Logger.error(
                `${moduleName} ${documentProcessError}`,
                traceId,
                `(${elasticSearchClientError.name}) - ${elasticSearchClientError.message}`,
              );
              return { response: 'QUERY_FAILURE_INVALID_QUERY', documents: [], failureMessage: responseException.message };
            }
            if (responseException?.body !== undefined) {
              let responseBody = JSON.parse(responseException?.body?.toString());
              if (responseBody?.error?.type !== undefined) {
                switch (responseBody?.error?.type) {
                  case 'IndexNotFoundException':
                    // No object has been uploaded for the requested type
                    Logger.warn(`${moduleName} ${documentProcessError} index not found`, traceId);
                    return {
                      response: 'QUERY_FAILURE_INVALID_QUERY',
                      documents: [],
                      failureMessage: 'IndexNotFoundException',
                    };
                  case 'SemanticAnalysisException':
                    // The query term is invalid
                    Logger.error(
                      `${moduleName} ${documentProcessError} invalid query terms`,
                      traceId,
                      `(${elasticSearchClientError.name}) - ${responseBody?.error?.reason}`,
                    );
                    return {
                      response: 'QUERY_FAILURE_INVALID_QUERY',
                      documents: [],
                      failureMessage: responseBody?.error?.details,
                    };
                  default:
                    Logger.error(`${moduleName} ${documentProcessError}`, traceId, responseBody ?? err);
                    return { response: 'UNKNOWN_FAILURE', documents: [], failureMessage: responseBody };
                }
              } else {
                responseBody = JSON.parse(JSON.stringify(responseException.body));
                Logger.error(`${moduleName} ${documentProcessError}`, traceId, responseBody ?? err);
                return { response: 'UNKNOWN_FAILURE', documents: [], failureMessage: responseBody };
              }
            }
          }
          break;
        }
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
